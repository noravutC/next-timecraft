import { db } from "@/db";
import {
  jobQueueTable,
  notificationsTable,
  projectMembersTable,
  projectsTable,
  taskCommentAttachmentsTable,
  taskCommentsTable,
  tasksTable,
  usersTable,
} from "@/db/schema";
import {
  countUnreadComments,
  fetchAttachmentsForComments,
  fetchCommentsPage,
  getTaskParticipantIds,
  getTaskProjectLink,
} from "@/db/uniq-query/comment/comment-utils";
import {
  classifyMime,
  COMMENT_MEDIA_BUCKET,
  isCommentMediaPath,
  maxBytesFor,
  supabaseAdmin,
  verifyUploadedObject,
} from "@/lib/supabase-storage";
import { AppError, BadRequestError, NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { triggerExclusive } from "@/lib/pusher-server";
import { filterByInAppPrefs } from "@/db/uniq-query/notification/notification-utils";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import type { NotificationPayload } from "@/types";
import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { parseId } from "@/lib/api/params";
import {
  createCommentSchema,
  type CreateCommentBody,
} from "@/validations/comment.validation";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

type RouteParams = { anyIds: string };

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const taskId = parseId(params.anyIds);
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
    const limit = Math.min(
      Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    const link = await getTaskProjectLink(taskId);
    if (!link) throw new NotFoundError("Task not found");

    await authorizeOrThrow(userId, [link.projectId], "project:view");

    const [page, unreadCount] = await Promise.all([
      fetchCommentsPage({ taskId, cursor, limit }),
      countUnreadComments({ userId, taskId }),
    ]);

    return NextResponse.json(
      {
        data: { ...page, unreadCount },
        message: "Fetch comments success",
        status: 200,
      },
      { status: 200 },
    );
  },
);

export const POST = createParamHandle<RouteParams, CreateCommentBody>(
  { body: createCommentSchema },
  async ({ request, params, body, userId, session }) => {
    const taskId = parseId(params.anyIds);
    const sessionUserName = session.user?.name ?? "Someone";
    const text = body.body.trim();
    const clientId = body.clientId;
    const mentions = [...new Set(body.mentions)];
    const attachmentsInput = body.attachments;

    const link = await getTaskProjectLink(taskId);
    if (!link) throw new NotFoundError("Task not found");

    await authorizeOrThrow(userId, [link.projectId], "task:comment");
    let attachmentUrls: string[] = [];
    if (attachmentsInput.length > 0) {
      await authorizeOrThrow(userId, [link.projectId], "comment:upload");
      if (!supabaseAdmin) throw new AppError(500, "Storage is not configured");
      const storage = supabaseAdmin.storage;
      attachmentUrls = attachmentsInput.map((a) => {
        if (classifyMime(a.mimeType) !== a.type) {
          throw new BadRequestError(
            `Unsupported attachment mime: ${a.mimeType}`,
          );
        }
        if (a.sizeBytes > maxBytesFor(a.type)) {
          throw new BadRequestError("Attachment exceeds size limit");
        }
        if (!isCommentMediaPath(a.storagePath, link.projectId, taskId)) {
          throw new BadRequestError("Invalid attachment path");
        }
        // Derive the public URL server-side from the validated path; never
        // trust the client-supplied url (could point anywhere).
        return storage.from(COMMENT_MEDIA_BUCKET).getPublicUrl(a.storagePath)
          .data.publicUrl;
      });
      const verified = await Promise.all(
        attachmentsInput.map((a) => verifyUploadedObject(a.storagePath, a.type)),
      );
      if (verified.includes(false)) {
        throw new BadRequestError("Attachment upload is missing or invalid");
      }
    }

    let validMentions: string[] = [];
    if (mentions.length > 0) {
      const projectMembers = await db
        .select({ userId: projectMembersTable.userId })
        .from(projectMembersTable)
        .where(
          and(
            eq(projectMembersTable.projectId, link.projectId),
            inArray(projectMembersTable.userId, mentions),
          ),
        );
      validMentions = projectMembers.map((m) => m.userId);
    }

    // ผู้เกี่ยวข้องเดิมของ task (assignees + คนเคยคอมเมนต์) — รับ comment_reply
    // ยกเว้นคนโพสต์เองและคนถูก mention (ซึ่งได้ comment_mention อยู่แล้ว)
    const participantIds = await getTaskParticipantIds(taskId);

    const result = await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(taskCommentsTable)
        // retry de-dup is per author + task, so a known clientId never
        // returns someone else's comment
        .where(
          and(
            eq(taskCommentsTable.clientId, clientId),
            eq(taskCommentsTable.taskId, taskId),
            eq(taskCommentsTable.userId, userId),
          ),
        )
        .limit(1);
      if (existing.length > 0) {
        return { comment: existing[0], notifications: [], dedup: true };
      }

      const [comment] = await tx
        .insert(taskCommentsTable)
        .values({
          taskId,
          userId,
          body: text,
          mentions: validMentions,
          clientId,
        })
        .returning();

      if (attachmentsInput.length > 0) {
        await tx.insert(taskCommentAttachmentsTable).values(
          attachmentsInput.map((a, idx) => ({
            commentId: comment.id,
            type: a.type,
            fileName: a.fileName ?? null,
            storagePath: a.storagePath,
            url: attachmentUrls[idx],
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            width: a.width ?? null,
            height: a.height ?? null,
            durationMs: a.durationMs ?? null,
            orderIndex: idx,
          })),
        );
      }

      await tx
        .update(tasksTable)
        .set({
          commentCount: sql`${tasksTable.commentCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(tasksTable.id, taskId));

      const recipients = validMentions.filter((u) => u !== userId);
      const replyRecipients = participantIds.filter(
        (u) => u !== userId && !recipients.includes(u),
      );
      let notifications: { id: string; userId: string }[] = [];

      if (recipients.length > 0 || replyRecipients.length > 0) {
        const [project] = await tx
          .select({ name: projectsTable.name })
          .from(projectsTable)
          .where(eq(projectsTable.id, link.projectId))
          .limit(1);

        const payload: NotificationPayload = {
          taskId,
          commentId: comment.id,
          projectId: link.projectId,
          actorUserId: userId,
          actorName: sessionUserName,
          taskTitle: link.taskTitle,
          projectName: project?.name ?? "Project",
          snippet: text.slice(0, 200),
        };

        // the bell only for people who want it; email is decided later
        const mentionInbox = await filterByInAppPrefs(
          recipients,
          "comment_mention",
          tx,
        );
        const replyInbox = await filterByInAppPrefs(
          replyRecipients,
          "comment_reply",
          tx,
        );

        if (mentionInbox.length > 0) {
          notifications = await tx
            .insert(notificationsTable)
            .values(
              mentionInbox.map((uid) => ({
                userId: uid,
                type: "comment_mention" as const,
                payload,
              })),
            )
            .returning({
              id: notificationsTable.id,
              userId: notificationsTable.userId,
            });
        }

        if (recipients.length > 0) {
          await tx.insert(jobQueueTable).values(
            recipients.map((uid) => ({
              jobType: "send_notification" as const,
              payload: {
                kind: "comment_mention",
                mentionedUserId: uid,
                ...payload,
              },
              idempotencyKey: `comment_mention:${comment.id}:${uid}`,
              priority: 5,
              scheduledAt: new Date(),
            })),
          );
        }

        if (replyRecipients.length > 0) {
          await tx.insert(jobQueueTable).values(
            replyRecipients.map((uid) => ({
              jobType: "send_notification" as const,
              payload: { kind: "comment_reply", recipientId: uid, ...payload },
              idempotencyKey: `comment_reply:${comment.id}:${uid}`,
              priority: 5,
              scheduledAt: new Date(),
            })),
          );
        }

        if (replyInbox.length > 0) {
          const replyRows = await tx
            .insert(notificationsTable)
            .values(
              replyInbox.map((uid) => ({
                userId: uid,
                type: "comment_reply" as const,
                payload,
              })),
            )
            .returning({
              id: notificationsTable.id,
              userId: notificationsTable.userId,
            });
          notifications = notifications.concat(replyRows);
        }
      }

      return { comment, notifications, dedup: false };
    });

    if (!result.dedup) {
      const [author] = await db
        .select({ fullName: usersTable.fullName, avatar: usersTable.avatar })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      const attachmentsByComment = await fetchAttachmentsForComments([
        result.comment.id,
      ]);

      const enriched = {
        ...result.comment,
        authorName: author?.fullName ?? sessionUserName,
        authorAvatar: author?.avatar ?? null,
        attachments: attachmentsByComment[result.comment.id] ?? [],
        reactions: [],
      };

      triggerExclusive(request, `task-${taskId}`, "comment-added", {
        comment: enriched,
        clientId,
      }).catch((e) => console.error("Pusher comment-added failed:", e));

      triggerExclusive(
        request,
        `project-${link.projectId}`,
        "task-comment-count",
        // the author's other tabs must not count their own comment as unread
        { taskId, delta: 1, authorId: userId },
      ).catch((e) => console.error("Pusher count failed:", e));

      for (const n of result.notifications) {
        const [notif] = await db
          .select()
          .from(notificationsTable)
          .where(eq(notificationsTable.id, n.id))
          .limit(1);
        if (notif) {
          triggerExclusive(
            request,
            `user-${n.userId}`,
            "notification-added",
            notif,
          ).catch((e) => console.error("Pusher notif failed:", e));
        }
      }

      return NextResponse.json(
        { created: enriched, message: "Create comment success", status: 201 },
        { status: 201 },
      );
    }

    const [author] = await db
      .select({ fullName: usersTable.fullName, avatar: usersTable.avatar })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const dedupAttachments = await fetchAttachmentsForComments([
      result.comment.id,
    ]);

    return NextResponse.json(
      {
        created: {
          ...result.comment,
          authorName: author?.fullName ?? sessionUserName,
          authorAvatar: author?.avatar ?? null,
          attachments: dedupAttachments[result.comment.id] ?? [],
          reactions: [],
        },
        message: "Comment already exists",
        status: 200,
      },
      { status: 200 },
    );
  },
);

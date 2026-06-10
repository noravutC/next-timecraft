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
  getTaskProjectLink,
} from "@/db/uniq-query/comment/comment-utils";
import {
  ALLOWED_IMAGE_MIME,
  ALLOWED_VIDEO_MIME,
  COMMENT_MEDIA_BUCKET,
  MAX_FILES_PER_COMMENT,
  maxBytesFor,
  supabaseAdmin,
} from "@/lib/supabase-storage";
import { AppError, BadRequestError, NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { triggerExclusive } from "@/lib/pusher-server";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import type { NotificationPayload } from "@/types";
import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_BODY_LEN = 5000;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

type RouteParams = { anyIds: string };

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const taskId = params.anyIds;
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

const attachmentSchema = z.object({
  type: z.enum(["image", "video"]),
  storagePath: z.string().min(1).max(512),
  url: z.string().url().max(1024),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  durationMs: z.number().int().positive().nullable().optional(),
});

const createCommentSchema = z
  .object({
    body: z.string().trim().max(MAX_BODY_LEN).default(""),
    mentions: z.array(z.string()).optional().default([]),
    clientId: z.string().trim().min(1, "clientId is required"),
    attachments: z
      .array(attachmentSchema)
      .max(MAX_FILES_PER_COMMENT)
      .optional()
      .default([]),
  })
  .refine((d) => d.body.trim().length > 0 || d.attachments.length > 0, {
    message: "Comment must have body or at least one attachment",
    path: ["body"],
  });

type CreateCommentBody = z.infer<typeof createCommentSchema>;

export const POST = createParamHandle<RouteParams, CreateCommentBody>(
  { body: createCommentSchema },
  async ({ request, params, body, userId, session }) => {
    const taskId = params.anyIds;
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
      attachmentUrls = attachmentsInput.map((a) => {
        const allowed =
          a.type === "image"
            ? ALLOWED_IMAGE_MIME.has(a.mimeType)
            : ALLOWED_VIDEO_MIME.has(a.mimeType);
        if (!allowed) {
          throw new BadRequestError(
            `Unsupported attachment mime: ${a.mimeType}`,
          );
        }
        if (a.sizeBytes > maxBytesFor(a.type)) {
          throw new BadRequestError("Attachment exceeds size limit");
        }
        if (!a.storagePath.startsWith(`${link.projectId}/${taskId}/`)) {
          throw new BadRequestError("Invalid attachment path");
        }
        // Derive the public URL server-side from the validated path; never
        // trust the client-supplied url (could point anywhere).
        return supabaseAdmin.storage
          .from(COMMENT_MEDIA_BUCKET)
          .getPublicUrl(a.storagePath).publicUrl;
      });
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

    const result = await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(taskCommentsTable)
        .where(eq(taskCommentsTable.clientId, clientId))
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
      let notifications: { id: string; userId: string }[] = [];

      if (recipients.length > 0) {
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

        notifications = await tx
          .insert(notificationsTable)
          .values(
            recipients.map((uid) => ({
              userId: uid,
              type: "comment_mention" as const,
              payload,
            })),
          )
          .returning({
            id: notificationsTable.id,
            userId: notificationsTable.userId,
          });

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
        { taskId, delta: 1 },
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

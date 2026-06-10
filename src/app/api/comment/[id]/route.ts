import { db } from "@/db";
import {
  projectMembersTable,
  taskCommentsTable,
  tasksTable,
  usersTable,
} from "@/db/schema";
import {
  fetchAttachmentsForComments,
  fetchReactionsForComments,
  getCommentLink,
} from "@/db/uniq-query/comment/comment-utils";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { triggerExclusive } from "@/lib/pusher-server";
import { authorize } from "@/lib/rbac/authorize";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_BODY_LEN = 5000;

type RouteParams = { id: string };

const updateCommentSchema = z.object({
  body: z.string().trim().min(1, "Body is required").max(MAX_BODY_LEN),
  mentions: z.array(z.string()).optional().default([]),
});

type UpdateCommentBody = z.infer<typeof updateCommentSchema>;

export const PATCH = createParamHandle<RouteParams, UpdateCommentBody>(
  { body: updateCommentSchema },
  async ({ request, params, body, userId }) => {
    const commentId = params.id;
    const text = body.body;
    const mentions = [...new Set(body.mentions)];

    const link = await getCommentLink(commentId);
    if (!link) throw new NotFoundError("Comment not found");

    const isAuthor = link.authorId === userId;
    const canModerate = await authorize(userId, [link.projectId], "comment:update");
    const canSelfEdit =
      isAuthor &&
      (await authorize(userId, [link.projectId], "task:comment"));
    if (!canModerate && !canSelfEdit) throw new ForbiddenError();

    let validMentions: string[] = [];
    if (mentions.length > 0) {
      const members = await db
        .select({ userId: projectMembersTable.userId })
        .from(projectMembersTable)
        .where(
          and(
            eq(projectMembersTable.projectId, link.projectId),
            inArray(projectMembersTable.userId, mentions),
          ),
        );
      validMentions = members.map((m) => m.userId);
    }

    const [{ createdAt }] = await db
      .select({ createdAt: taskCommentsTable.createdAt })
      .from(taskCommentsTable)
      .where(eq(taskCommentsTable.id, commentId))
      .limit(1);

    const sinceCreated = Date.now() - new Date(createdAt).getTime();
    const markEdited = sinceCreated > 60_000;

    const [updated] = await db
      .update(taskCommentsTable)
      .set({
        body: text,
        mentions: validMentions,
        editedAt: markEdited ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(taskCommentsTable.id, commentId),
          isNull(taskCommentsTable.deletedAt),
        ),
      )
      .returning();

    if (!updated) throw new NotFoundError("Comment not found");

    const [author] = await db
      .select({ fullName: usersTable.fullName, avatar: usersTable.avatar })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const [attachmentsByComment, reactionsByComment] = await Promise.all([
      fetchAttachmentsForComments([commentId]),
      fetchReactionsForComments([commentId]),
    ]);

    const enriched = {
      ...updated,
      authorName: author?.fullName ?? "",
      authorAvatar: author?.avatar ?? null,
      attachments: attachmentsByComment[commentId] ?? [],
      reactions: reactionsByComment[commentId] ?? [],
    };

    triggerExclusive(
      request,
      `task-${link.taskId}`,
      "comment-updated",
      enriched,
    ).catch((e) => console.error("Pusher comment-updated failed:", e));

    return NextResponse.json(
      { updated: enriched, message: "Update comment success", status: 200 },
      { status: 200 },
    );
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const commentId = params.id;

    const link = await getCommentLink(commentId);
    if (!link) throw new NotFoundError("Comment not found");

    const isAuthor = link.authorId === userId;
    const canModerate = await authorize(userId, [link.projectId], "comment:delete");
    const canSelfDelete =
      isAuthor &&
      (await authorize(userId, [link.projectId], "task:comment"));
    if (!canModerate && !canSelfDelete) throw new ForbiddenError();

    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(taskCommentsTable)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(taskCommentsTable.id, commentId),
            isNull(taskCommentsTable.deletedAt),
          ),
        )
        .returning();
      if (!row) return null;

      await tx
        .update(tasksTable)
        .set({
          commentCount: sql`GREATEST(${tasksTable.commentCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(tasksTable.id, link.taskId));

      return row;
    });

    if (!updated) throw new NotFoundError("Comment not found");

    triggerExclusive(request, `task-${link.taskId}`, "comment-deleted", {
      id: commentId,
    }).catch((e) => console.error("Pusher comment-deleted failed:", e));
    triggerExclusive(
      request,
      `project-${link.projectId}`,
      "task-comment-count",
      { taskId: link.taskId, delta: -1 },
    ).catch((e) => console.error("Pusher count failed:", e));

    return NextResponse.json(
      { deleted: true, message: "Delete comment success", status: 200 },
      { status: 200 },
    );
  },
);

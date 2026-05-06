import { authOptions } from "@/auth";
import { db } from "@/db";
import {
  projectMembersTable,
  taskCommentsTable,
  tasksTable,
  usersTable,
} from "@/db/schema";
import { getCommentLink } from "@/db/uniq-query/comment/comment-utils";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { pusherServer } from "@/lib/pusher-server";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const MAX_BODY_LEN = 5000;

type RouteParams = { id: string };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json(
      { updated: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  const { id: commentId } = await params;

  let body: { body?: string; mentions?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { updated: null, message: "Invalid JSON", status: 400 },
      { status: 400 },
    );
  }

  const text = (body.body ?? "").trim();
  const mentions = Array.isArray(body.mentions)
    ? [...new Set(body.mentions.filter((m) => typeof m === "string"))]
    : [];

  if (!text) {
    return NextResponse.json(
      { updated: null, message: "Body is required", status: 400 },
      { status: 400 },
    );
  }
  if (text.length > MAX_BODY_LEN) {
    return NextResponse.json(
      {
        updated: null,
        message: `Body must be ${MAX_BODY_LEN} characters or fewer`,
        status: 400,
      },
      { status: 400 },
    );
  }

  const link = await getCommentLink(commentId);
  if (!link) {
    return NextResponse.json(
      { updated: null, message: "Comment not found", status: 404 },
      { status: 404 },
    );
  }
  const isAuthor = link.authorId === sessionUserId;
  const canModerate = await hasPermission(
    sessionUserId,
    [link.projectId],
    "comment:update",
  );
  const canSelfEdit =
    isAuthor &&
    (await hasPermission(sessionUserId, [link.projectId], "task:comment"));
  if (!canModerate && !canSelfEdit) {
    return NextResponse.json(
      { updated: null, message: "Forbidden", status: 403 },
      { status: 403 },
    );
  }

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

  try {
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

    if (!updated) {
      return NextResponse.json(
        { updated: null, message: "Comment not found", status: 404 },
        { status: 404 },
      );
    }

    const [author] = await db
      .select({ fullName: usersTable.fullName, avatar: usersTable.avatar })
      .from(usersTable)
      .where(eq(usersTable.id, sessionUserId))
      .limit(1);

    const enriched = {
      ...updated,
      authorName: author?.fullName ?? "",
      authorAvatar: author?.avatar ?? null,
    };

    pusherServer
      .trigger(`task-${link.taskId}`, "comment-updated", enriched)
      .catch((e) => console.error("Pusher comment-updated failed:", e));

    return NextResponse.json(
      { updated: enriched, message: "Update comment success", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update comment:", error);
    return NextResponse.json(
      { updated: null, message: "Failed to update comment", status: 500 },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json(
      { deleted: false, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  const { id: commentId } = await params;

  const link = await getCommentLink(commentId);
  if (!link) {
    return NextResponse.json(
      { deleted: false, message: "Comment not found", status: 404 },
      { status: 404 },
    );
  }
  const isAuthor = link.authorId === sessionUserId;
  const canModerate = await hasPermission(
    sessionUserId,
    [link.projectId],
    "comment:delete",
  );
  const canSelfDelete =
    isAuthor &&
    (await hasPermission(sessionUserId, [link.projectId], "task:comment"));
  if (!canModerate && !canSelfDelete) {
    return NextResponse.json(
      { deleted: false, message: "Forbidden", status: 403 },
      { status: 403 },
    );
  }

  try {
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

    if (!updated) {
      return NextResponse.json(
        { deleted: false, message: "Comment not found", status: 404 },
        { status: 404 },
      );
    }

    pusherServer
      .trigger(`task-${link.taskId}`, "comment-deleted", {
        id: commentId,
      })
      .catch((e) => console.error("Pusher comment-deleted failed:", e));
    pusherServer
      .trigger(`project-${link.projectId}`, "task-comment-count", {
        taskId: link.taskId,
        delta: -1,
      })
      .catch((e) => console.error("Pusher count failed:", e));

    return NextResponse.json(
      { deleted: true, message: "Delete comment success", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { deleted: false, message: "Failed to delete comment", status: 500 },
      { status: 500 },
    );
  }
}

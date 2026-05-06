import { authOptions } from "@/auth";
import { db } from "@/db";
import {
  jobQueueTable,
  notificationsTable,
  projectMembersTable,
  projectsTable,
  taskCommentsTable,
  tasksTable,
  usersTable,
} from "@/db/schema";
import {
  countUnreadComments,
  fetchCommentsPage,
  getTaskProjectLink,
} from "@/db/uniq-query/comment/comment-utils";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { pusherServer } from "@/lib/pusher-server";
import type { NotificationPayload } from "@/types";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const MAX_BODY_LEN = 5000;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

type RouteParams = { anyIds: string };

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json(
      { data: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  const { anyIds: taskId } = await params;
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const link = await getTaskProjectLink(taskId);
  if (!link) {
    return NextResponse.json(
      { data: null, message: "Task not found", status: 404 },
      { status: 404 },
    );
  }
  const permitted = await hasPermission(
    sessionUserId,
    [link.projectId],
    "project:view",
  );
  if (!permitted) {
    return NextResponse.json(
      { data: null, message: "Forbidden", status: 403 },
      { status: 403 },
    );
  }

  try {
    const [page, unreadCount] = await Promise.all([
      fetchCommentsPage({ taskId, cursor, limit }),
      countUnreadComments({ userId: sessionUserId, taskId }),
    ]);

    return NextResponse.json(
      {
        data: { ...page, unreadCount },
        message: "Fetch comments success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { data: null, message: "Failed to fetch comments", status: 500 },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  const sessionUserName = session?.user?.name ?? "Someone";
  if (!sessionUserId) {
    return NextResponse.json(
      { created: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  const { anyIds: taskId } = await params;

  let body: {
    body?: string;
    mentions?: string[];
    clientId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { created: null, message: "Invalid JSON", status: 400 },
      { status: 400 },
    );
  }

  const text = (body.body ?? "").trim();
  const clientId = (body.clientId ?? "").trim();
  const mentions = Array.isArray(body.mentions)
    ? [...new Set(body.mentions.filter((m) => typeof m === "string"))]
    : [];

  if (!text) {
    return NextResponse.json(
      { created: null, message: "Body is required", status: 400 },
      { status: 400 },
    );
  }
  if (text.length > MAX_BODY_LEN) {
    return NextResponse.json(
      {
        created: null,
        message: `Body must be ${MAX_BODY_LEN} characters or fewer`,
        status: 400,
      },
      { status: 400 },
    );
  }
  if (!clientId) {
    return NextResponse.json(
      { created: null, message: "clientId is required", status: 400 },
      { status: 400 },
    );
  }

  const link = await getTaskProjectLink(taskId);
  if (!link) {
    return NextResponse.json(
      { created: null, message: "Task not found", status: 404 },
      { status: 404 },
    );
  }
  const permitted = await hasPermission(
    sessionUserId,
    [link.projectId],
    "task:comment",
  );
  if (!permitted) {
    return NextResponse.json(
      { created: null, message: "Forbidden", status: 403 },
      { status: 403 },
    );
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

  try {
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
          userId: sessionUserId,
          body: text,
          mentions: validMentions,
          clientId,
        })
        .returning();

      await tx
        .update(tasksTable)
        .set({
          commentCount: sql`${tasksTable.commentCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(tasksTable.id, taskId));

      const recipients = validMentions.filter((u) => u !== sessionUserId);
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
          actorUserId: sessionUserId,
          actorName: sessionUserName,
          taskTitle: link.taskTitle,
          projectName: project?.name ?? "Project",
          snippet: text.slice(0, 200),
        };

        notifications = await tx
          .insert(notificationsTable)
          .values(
            recipients.map((userId) => ({
              userId,
              type: "comment_mention" as const,
              payload,
            })),
          )
          .returning({
            id: notificationsTable.id,
            userId: notificationsTable.userId,
          });

        await tx.insert(jobQueueTable).values(
          recipients.map((userId) => ({
            jobType: "send_notification" as const,
            payload: {
              kind: "comment_mention",
              mentionedUserId: userId,
              ...payload,
            },
            idempotencyKey: `comment_mention:${comment.id}:${userId}`,
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
        .where(eq(usersTable.id, sessionUserId))
        .limit(1);

      const enriched = {
        ...result.comment,
        authorName: author?.fullName ?? sessionUserName,
        authorAvatar: author?.avatar ?? null,
      };

      pusherServer
        .trigger(`task-${taskId}`, "comment-added", {
          comment: enriched,
          clientId,
        })
        .catch((e) => console.error("Pusher comment-added failed:", e));

      pusherServer
        .trigger(`project-${link.projectId}`, "task-comment-count", {
          taskId,
          delta: 1,
        })
        .catch((e) => console.error("Pusher count failed:", e));

      for (const n of result.notifications) {
        const [notif] = await db
          .select()
          .from(notificationsTable)
          .where(eq(notificationsTable.id, n.id))
          .limit(1);
        if (notif) {
          pusherServer
            .trigger(`user-${n.userId}`, "notification-added", notif)
            .catch((e) => console.error("Pusher notif failed:", e));
        }
      }

      return NextResponse.json(
        {
          created: enriched,
          message: "Create comment success",
          status: 201,
        },
        { status: 201 },
      );
    }

    const [author] = await db
      .select({ fullName: usersTable.fullName, avatar: usersTable.avatar })
      .from(usersTable)
      .where(eq(usersTable.id, sessionUserId))
      .limit(1);

    return NextResponse.json(
      {
        created: {
          ...result.comment,
          authorName: author?.fullName ?? sessionUserName,
          authorAvatar: author?.avatar ?? null,
        },
        message: "Comment already exists",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { created: null, message: "Failed to create comment", status: 500 },
      { status: 500 },
    );
  }
}

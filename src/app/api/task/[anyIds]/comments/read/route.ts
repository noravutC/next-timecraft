import { authOptions } from "@/auth";
import { db } from "@/db";
import { commentReadStateTable } from "@/db/schema";
import { getTaskProjectLink } from "@/db/uniq-query/comment/comment-utils";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

type RouteParams = { anyIds: string };

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json(
      { created: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  const { anyIds: taskId } = await params;

  let body: { lastReadCommentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { created: null, message: "Invalid JSON", status: 400 },
      { status: 400 },
    );
  }

  const lastReadCommentId = body.lastReadCommentId ?? null;

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
    "project:view",
  );
  if (!permitted) {
    return NextResponse.json(
      { created: null, message: "Forbidden", status: 403 },
      { status: 403 },
    );
  }

  try {
    await db
      .insert(commentReadStateTable)
      .values({
        userId: sessionUserId,
        taskId,
        lastReadCommentId,
        lastReadAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [commentReadStateTable.userId, commentReadStateTable.taskId],
        set: {
          lastReadCommentId,
          lastReadAt: sql`now()`,
        },
      });

    return NextResponse.json(
      { created: { ok: true }, message: "Marked read", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to mark read:", error);
    return NextResponse.json(
      { created: null, message: "Failed to mark read", status: 500 },
      { status: 500 },
    );
  }
}

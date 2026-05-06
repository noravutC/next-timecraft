import { authOptions } from "@/auth";
import { db } from "@/db";
import { subtasksTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { getSubtaskTaskLink } from "@/db/uniq-query/task/subtask-utils";
import { pusherServer } from "@/lib/pusher-server";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const MAX_TITLE_LEN = 500;
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

  const { id } = await params;

  let body: { title?: string; completed?: boolean; orderFraction?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { updated: null, message: "Invalid JSON", status: 400 },
      { status: 400 },
    );
  }

  const link = await getSubtaskTaskLink(id);
  if (!link) {
    return NextResponse.json(
      { updated: null, message: "Subtask not found", status: 404 },
      { status: 404 },
    );
  }
  const permitted = await hasPermission(
    sessionUserId,
    [link.projectId],
    "task:update",
  );
  if (!permitted) {
    return NextResponse.json(
      { updated: null, message: "Forbidden", status: 403 },
      { status: 403 },
    );
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json(
        { updated: null, message: "Title is required", status: 400 },
        { status: 400 },
      );
    }
    if (title.length > MAX_TITLE_LEN) {
      return NextResponse.json(
        { updated: null, message: "Title too long", status: 400 },
        { status: 400 },
      );
    }
    patch.title = title;
  }
  if (typeof body.completed === "boolean") {
    patch.completed = body.completed;
    patch.completedAt = body.completed ? new Date() : null;
  }
  if (typeof body.orderFraction === "string" && body.orderFraction.trim()) {
    patch.orderFraction = body.orderFraction.trim();
  }

  try {
    const [updated] = await db
      .update(subtasksTable)
      .set(patch)
      .where(eq(subtasksTable.id, id))
      .returning();

    pusherServer
      .trigger(`task-${link.taskId}`, "subtask-updated", updated)
      .catch((e) => console.error("Pusher subtask-updated failed:", e));

    return NextResponse.json(
      { updated, message: "Update subtask success", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update subtask:", error);
    return NextResponse.json(
      { updated: null, message: "Failed to update subtask", status: 500 },
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

  const { id } = await params;
  const link = await getSubtaskTaskLink(id);
  if (!link) {
    return NextResponse.json(
      { deleted: false, message: "Subtask not found", status: 404 },
      { status: 404 },
    );
  }
  const permitted = await hasPermission(
    sessionUserId,
    [link.projectId],
    "task:update",
  );
  if (!permitted) {
    return NextResponse.json(
      { deleted: false, message: "Forbidden", status: 403 },
      { status: 403 },
    );
  }

  try {
    await db.delete(subtasksTable).where(eq(subtasksTable.id, id));
    pusherServer
      .trigger(`task-${link.taskId}`, "subtask-deleted", { id })
      .catch((e) => console.error("Pusher subtask-deleted failed:", e));
    return NextResponse.json(
      { deleted: true, message: "Delete subtask success", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to delete subtask:", error);
    return NextResponse.json(
      { deleted: false, message: "Failed to delete subtask", status: 500 },
      { status: 500 },
    );
  }
}

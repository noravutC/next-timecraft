import { authOptions } from "@/auth";
import { db } from "@/db";
import { projectMembersTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import {
  fetchAssignees,
  getTaskColumnLink,
  setAssignees,
} from "@/db/uniq-query/task/assignee-utils";
import { pusherServer } from "@/lib/pusher-server";
import { and, eq, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

type RouteParams = { anyIds: string };

export async function GET(
  _request: Request,
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
  const link = await getTaskColumnLink(taskId);
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
    const data = await fetchAssignees(taskId);
    return NextResponse.json(
      { data, message: "Fetch assignees success", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch assignees:", error);
    return NextResponse.json(
      { data: null, message: "Failed to fetch assignees", status: 500 },
      { status: 500 },
    );
  }
}

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

  const { anyIds: taskId } = await params;

  let body: { userIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { updated: null, message: "Invalid JSON", status: 400 },
      { status: 400 },
    );
  }

  const requested = Array.isArray(body.userIds)
    ? [...new Set(body.userIds.filter((u) => typeof u === "string"))]
    : [];

  const link = await getTaskColumnLink(taskId);
  if (!link) {
    return NextResponse.json(
      { updated: null, message: "Task not found", status: 404 },
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

  let validUserIds: string[] = [];
  if (requested.length > 0) {
    const members = await db
      .select({ userId: projectMembersTable.userId })
      .from(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.projectId, link.projectId),
          inArray(projectMembersTable.userId, requested),
        ),
      );
    validUserIds = members.map((m) => m.userId);
  }

  try {
    const updated = await setAssignees(taskId, validUserIds);
    pusherServer
      .trigger(`project-${link.projectId}`, "task-assignees-updated", {
        taskId,
        assignees: updated,
      })
      .catch((e) => console.error("Pusher assignees failed:", e));

    return NextResponse.json(
      { updated, message: "Update assignees success", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update assignees:", error);
    return NextResponse.json(
      { updated: null, message: "Failed to update assignees", status: 500 },
      { status: 500 },
    );
  }
}

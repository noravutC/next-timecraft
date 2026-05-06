import { authOptions } from "@/auth";
import { db } from "@/db";
import { subtasksTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { getTaskColumnLink } from "@/db/uniq-query/task/assignee-utils";
import { fetchSubtasks } from "@/db/uniq-query/task/subtask-utils";
import { pusherServer } from "@/lib/pusher-server";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const MAX_TITLE_LEN = 500;
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
    const data = await fetchSubtasks(taskId);
    return NextResponse.json(
      { data, message: "Fetch subtasks success", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch subtasks:", error);
    return NextResponse.json(
      { data: null, message: "Failed to fetch subtasks", status: 500 },
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
  if (!sessionUserId) {
    return NextResponse.json(
      { created: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  const { anyIds: taskId } = await params;

  let body: { title?: string; orderFraction?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { created: null, message: "Invalid JSON", status: 400 },
      { status: 400 },
    );
  }

  const title = (body.title ?? "").trim();
  const orderFraction = (body.orderFraction ?? "").trim() || "a0";

  if (!title) {
    return NextResponse.json(
      { created: null, message: "Title is required", status: 400 },
      { status: 400 },
    );
  }
  if (title.length > MAX_TITLE_LEN) {
    return NextResponse.json(
      {
        created: null,
        message: `Title must be ${MAX_TITLE_LEN} characters or fewer`,
        status: 400,
      },
      { status: 400 },
    );
  }

  const link = await getTaskColumnLink(taskId);
  if (!link) {
    return NextResponse.json(
      { created: null, message: "Task not found", status: 404 },
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
      { created: null, message: "Forbidden", status: 403 },
      { status: 403 },
    );
  }

  try {
    const [created] = await db
      .insert(subtasksTable)
      .values({ taskId, title, orderFraction })
      .returning();

    pusherServer
      .trigger(`task-${taskId}`, "subtask-added", created)
      .catch((e) => console.error("Pusher subtask-added failed:", e));

    return NextResponse.json(
      { created, message: "Create subtask success", status: 201 },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create subtask:", error);
    return NextResponse.json(
      { created: null, message: "Failed to create subtask", status: 500 },
      { status: 500 },
    );
  }
}

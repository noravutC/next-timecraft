import { authOptions } from "@/auth";
import { db } from "@/db";
import { columnsTable, tasksTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { CreateTaskPayload, NewTaskRow } from "@/types";
import { inArray } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

type CreateTaskBody = Array<CreateTaskPayload>;

const normalizeCreateInput = (item: CreateTaskBody[number]): CreateTaskPayload => {
  const columnId = item.columnId?.trim() ?? "";
  const title = item.title?.trim() ?? "";

  if (!columnId || !title) {
    throw new Error("columnId and title are required");
  }

  return {
    columnId,
    title,
    description: item.description?.trim() || null,
    orderFraction: item.orderFraction?.trim() || "0",
    tags: Array.isArray(item.tags) ? item.tags : [],
    priority: item.priority ?? "medium",
    dueDate: item.dueDate ?? null,
  };
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        created: null,
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as CreateTaskBody;
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        {
          created: null,
          message: "Payload must be a non-empty array",
          status: 400,
        },
        { status: 400 },
      );
    }

    const normalizedBody = body.map(normalizeCreateInput);
    const columnIds = [...new Set(normalizedBody.map((item) => item.columnId))];

    const columnLinks = await db
      .select({ columnId: columnsTable.id, projectId: columnsTable.projectId })
      .from(columnsTable)
      .where(inArray(columnsTable.id, columnIds));

    if (columnLinks.length !== columnIds.length) {
      return NextResponse.json(
        {
          created: null,
          message: "Some columns not found",
          status: 404,
        },
        { status: 404 },
      );
    }

    const projectIds = [...new Set(columnLinks.map((c) => c.projectId))];
    const permitted = await hasPermission(sessionUserId, projectIds, "task:create");
    if (!permitted) {
      return NextResponse.json(
        {
          created: null,
          message: "Forbidden",
          status: 403,
        },
        { status: 403 },
      );
    }

    const rowsToInsert: NewTaskRow[] = normalizedBody.map((item) => ({
      columnId: item.columnId,
      title: item.title,
      description: item.description ?? null,
      orderFraction: item.orderFraction ?? "0",
      tags: item.tags ?? [],
      priority: item.priority ?? "medium",
      dueDate: item.dueDate ?? null,
      updatedAt: new Date(),
    }));

    const createdTasks = await db
      .insert(tasksTable)
      .values(rowsToInsert)
      .returning();

    return NextResponse.json(
      {
        created: createdTasks.map((task) => ({
          ...task,
          timestamp: Date.now(),
        })),
        message: "Create tasks success",
        status: 201,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message === "columnId and title are required"
        ? error.message
        : "Failed to create tasks";
    const statusCode = message === "columnId and title are required" ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to create tasks:", error);
    }

    return NextResponse.json(
      {
        created: null,
        message,
        status: statusCode,
      },
      { status: statusCode },
    );
  }
}

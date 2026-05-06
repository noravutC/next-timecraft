import { authOptions } from "@/auth";
import { db } from "@/db";
import { columnsTable, tasksTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { UpdateTaskPayload } from "@/types";
import { eq, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

type RouteParams = {
  anyIds: string;
};

type UpdateTaskBody = Array<UpdateTaskPayload>;

const getTaskProjectLinks = async (taskIds: string[]) =>
  db
    .select({
      taskId: tasksTable.id,
      projectId: columnsTable.projectId,
    })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(tasksTable.columnId, columnsTable.id))
    .where(inArray(tasksTable.id, taskIds));

export async function PATCH(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        updated: null,
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 },
    );
  }

  const { anyIds } = await params;
  const taskIds = anyIds
    .trim()
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id);
  if (taskIds.length === 0) {
    return NextResponse.json(
      {
        updated: null,
        message: "taskIds are required",
        status: 400,
      },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as UpdateTaskBody;
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        {
          updated: null,
          message: "Payload must be a non-empty array",
          status: 400,
        },
        { status: 400 },
      );
    }

    const existingTaskLinks = await getTaskProjectLinks(taskIds);
    if (existingTaskLinks.length === 0) {
      return NextResponse.json(
        {
          updated: null,
          message: "Tasks not found",
          status: 404,
        },
        { status: 404 },
      );
    }

    const payloadById = new Map<string, UpdateTaskPayload>();
    body.forEach((item) => {
      if (item.id) {
        payloadById.set(item.id, item);
      }
    });

    const targetIds = taskIds.filter((id) => payloadById.has(id));
    if (targetIds.length === 0) {
      return NextResponse.json(
        {
          updated: null,
          message: "No matching payload for taskIds",
          status: 400,
        },
        { status: 400 },
      );
    }

    const destinationColumnIds = [
      ...new Set(
        targetIds
          .map((taskId) => payloadById.get(taskId)?.columnId)
          .filter((columnId): columnId is string => Boolean(columnId)),
      ),
    ];
    const destinationLinks =
      destinationColumnIds.length > 0
        ? await db
            .select({
              columnId: columnsTable.id,
              projectId: columnsTable.projectId,
            })
            .from(columnsTable)
            .where(inArray(columnsTable.id, destinationColumnIds))
        : [];
    if (destinationLinks.length !== destinationColumnIds.length) {
      return NextResponse.json(
        {
          updated: null,
          message: "Some destination columns not found",
          status: 400,
        },
        { status: 400 },
      );
    }

    const uniqProjectIds = [
      ...new Set([
        ...existingTaskLinks.map((task) => task.projectId),
        ...destinationLinks.map((column) => column.projectId),
      ]),
    ];
    const permission = await hasPermission(
      sessionUserId,
      uniqProjectIds,
      "task:update",
    );
    if (!permission) {
      return NextResponse.json(
        {
          updated: null,
          message: "Forbidden",
          status: 403,
        },
        { status: 403 },
      );
    }

    const updatedTasks = await db.transaction(async (tx) => {
      const rows = [];

      for (const taskId of targetIds) {
        const item = payloadById.get(taskId);
        if (!item) continue;

        const dueDate =
          item.dueDate === undefined
            ? undefined
            : item.dueDate === null
              ? null
              : new Date(item.dueDate);

        const [updated] = await tx
          .update(tasksTable)
          .set({
            columnId: item.columnId,
            title: item.title,
            description: item.description,
            orderFraction: item.orderFraction,
            tags: item.tags,
            priority: item.priority,
            dueDate,
            archived: item.archived,
            estimatedHours: item.estimatedHours,
            updatedAt: new Date(),
          })
          .where(eq(tasksTable.id, taskId))
          .returning();

        if (updated) {
          rows.push(updated);
        }
      }

      return rows;
    });

    return NextResponse.json(
      {
        updated: updatedTasks,
        message: "Update tasks success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update tasks:", error);
    return NextResponse.json(
      {
        updated: null,
        message: "Failed to update tasks",
        status: 500,
      },
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
      {
        deleted: false,
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 },
    );
  }

  const { anyIds } = await params;
  const taskIds = anyIds
    .trim()
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id);
  if (taskIds.length === 0) {
    return NextResponse.json(
      {
        deleted: false,
        message: "taskIds are required",
        status: 400,
      },
      { status: 400 },
    );
  }

  try {
    const existingTaskLinks = await getTaskProjectLinks(taskIds);
    if (existingTaskLinks.length === 0) {
      return NextResponse.json(
        {
          deleted: false,
          message: "Tasks not found",
          status: 404,
        },
        { status: 404 },
      );
    }

    const uniqProjectIds = [
      ...new Set(existingTaskLinks.map((task) => task.projectId)),
    ];
    const permission = await hasPermission(
      sessionUserId,
      uniqProjectIds,
      "task:delete",
    );
    if (!permission) {
      return NextResponse.json(
        {
          deleted: false,
          message: "Forbidden",
          status: 403,
        },
        { status: 403 },
      );
    }

    const deletedRows = await db
      .delete(tasksTable)
      .where(inArray(tasksTable.id, taskIds))
      .returning({ id: tasksTable.id });

    return NextResponse.json(
      {
        deleted: deletedRows.length === taskIds.length,
        message: "Delete tasks success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to delete tasks:", error);
    return NextResponse.json(
      {
        deleted: false,
        message: "Failed to delete tasks",
        status: 500,
      },
      { status: 500 },
    );
  }
}

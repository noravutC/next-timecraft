import { db } from "@/db";
import { columnsTable, tasksTable } from "@/db/schema";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { triggerExclusive } from "@/lib/pusher-server";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

type RouteParams = { anyIds: string };

const updateTaskSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      columnId: z.string().optional(),
      title: z.string().optional(),
      description: z.string().nullable().optional(),
      orderFraction: z.string().optional(),
      tags: z.array(z.string()).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.union([z.string(), z.null()]).optional(),
      archived: z.boolean().optional(),
      estimatedHours: z.number().optional(),
    }),
  )
  .min(1, "Payload must be a non-empty array");

type UpdateTaskBody = z.infer<typeof updateTaskSchema>;

const parseIds = (anyIds: string): string[] =>
  anyIds
    .trim()
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id);

const getTaskProjectLinks = async (taskIds: string[]) =>
  db
    .select({
      taskId: tasksTable.id,
      projectId: columnsTable.projectId,
    })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(tasksTable.columnId, columnsTable.id))
    .where(inArray(tasksTable.id, taskIds));

export const PATCH = createParamHandle<RouteParams, UpdateTaskBody>(
  { body: updateTaskSchema },
  async ({ request, params, body, userId }) => {
    const taskIds = parseIds(params.anyIds);
    if (taskIds.length === 0) throw new BadRequestError("taskIds are required");

    const existingTaskLinks = await getTaskProjectLinks(taskIds);
    if (existingTaskLinks.length === 0) {
      throw new NotFoundError("Tasks not found");
    }

    const payloadById = new Map<string, UpdateTaskBody[number]>();
    body.forEach((item) => {
      if (item.id) payloadById.set(item.id, item);
    });

    const targetIds = taskIds.filter((id) => payloadById.has(id));
    if (targetIds.length === 0) {
      throw new BadRequestError("No matching payload for taskIds");
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
      throw new BadRequestError("Some destination columns not found");
    }

    const uniqProjectIds = [
      ...new Set([
        ...existingTaskLinks.map((task) => task.projectId),
        ...destinationLinks.map((column) => column.projectId),
      ]),
    ];
    await authorizeOrThrow(userId, uniqProjectIds, "task:update");

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

        if (updated) rows.push(updated);
      }

      return rows;
    });

    const projectByTask = new Map(
      existingTaskLinks.map((l) => [l.taskId, l.projectId]),
    );
    const projectByColumn = new Map(
      destinationLinks.map((l) => [l.columnId, l.projectId]),
    );
    const groupedByProject = new Map<string, typeof updatedTasks>();
    for (const task of updatedTasks) {
      const pid =
        projectByColumn.get(task.columnId) ?? projectByTask.get(task.id);
      if (!pid) continue;
      const list = groupedByProject.get(pid) ?? [];
      list.push(task);
      groupedByProject.set(pid, list);
    }
    for (const [pid, tasks] of groupedByProject) {
      triggerExclusive(request, `project-${pid}`, "tasks-updated", tasks).catch(
        (e) => console.error("Pusher tasks-updated failed:", e),
      );
    }

    return NextResponse.json(
      { updated: updatedTasks, message: "Update tasks success", status: 200 },
      { status: 200 },
    );
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const taskIds = parseIds(params.anyIds);
    if (taskIds.length === 0) throw new BadRequestError("taskIds are required");

    const existingTaskLinks = await getTaskProjectLinks(taskIds);
    if (existingTaskLinks.length === 0) {
      throw new NotFoundError("Tasks not found");
    }

    const uniqProjectIds = [
      ...new Set(existingTaskLinks.map((task) => task.projectId)),
    ];
    await authorizeOrThrow(userId, uniqProjectIds, "task:delete");

    const deletedRows = await db
      .delete(tasksTable)
      .where(inArray(tasksTable.id, taskIds))
      .returning({ id: tasksTable.id });

    const deletedIdSet = new Set(deletedRows.map((r) => r.id));
    const groupedByProject = new Map<string, string[]>();
    for (const link of existingTaskLinks) {
      if (!deletedIdSet.has(link.taskId)) continue;
      const list = groupedByProject.get(link.projectId) ?? [];
      list.push(link.taskId);
      groupedByProject.set(link.projectId, list);
    }
    for (const [pid, ids] of groupedByProject) {
      triggerExclusive(request, `project-${pid}`, "tasks-deleted", ids).catch(
        (e) => console.error("Pusher tasks-deleted failed:", e),
      );
    }

    return NextResponse.json(
      {
        deleted: deletedRows.length === taskIds.length,
        message: "Delete tasks success",
        status: 200,
      },
      { status: 200 },
    );
  },
);

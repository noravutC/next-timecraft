import { db } from "@/db";
import { tasksTable } from "@/db/schema";
import { getActiveColumnLinks } from "@/db/uniq-query/column/column-utils";
import {
  getColumnRefs,
  recordTaskActivities,
} from "@/db/uniq-query/task/activity-utils";
import { refreshTasks } from "@/db/uniq-query/task/task-utils";
import { createHandle } from "@/lib/api/handle";
import { NotFoundError } from "@/lib/api/errors";
import { triggerExclusive } from "@/lib/pusher-server";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { NewTaskRow } from "@/types";
import { NextResponse } from "next/server";
import {
  createTaskSchema,
  type CreateTaskBody,
} from "@/validations/task.validation";

export const POST = createHandle<CreateTaskBody>(
  { body: createTaskSchema },
  async ({ request, userId, body }) => {
    const columnIds = [...new Set(body.map((item) => item.columnId))];

    const columnLinks = await getActiveColumnLinks(columnIds);

    if (columnLinks.length !== columnIds.length) {
      throw new NotFoundError("Some columns not found");
    }

    const projectIds = [...new Set(columnLinks.map((c) => c.projectId))];
    await authorizeOrThrow(userId, projectIds, "task:create");

    const rowsToInsert: NewTaskRow[] = body.map((item) => ({
      columnId: item.columnId,
      title: item.title,
      description: item.description ?? null,
      orderFraction: item.orderFraction?.trim() || "a0",
      tags: item.tags ?? [],
      priority: item.priority ?? "medium",
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
      updatedAt: new Date(),
    }));

    const inserted = await db
      .insert(tasksTable)
      .values(rowsToInsert)
      .returning();

    const columnRefs = await getColumnRefs(columnIds);
    const changedByRules = await recordTaskActivities(
      userId,
      inserted.map((task) => ({
        taskId: task.id,
        entry: {
          type: "created",
          data: { column: columnRefs.get(task.columnId) ?? null },
        },
      })),
    );
    // a rule may have changed a new task already
    const createdTasks = await refreshTasks(inserted, changedByRules);

    const projectByColumn = new Map(
      columnLinks.map((c) => [c.columnId, c.projectId]),
    );
    const groupedByProject = new Map<string, typeof createdTasks>();
    for (const task of createdTasks) {
      const pid = projectByColumn.get(task.columnId);
      if (!pid) continue;
      const list = groupedByProject.get(pid) ?? [];
      list.push(task);
      groupedByProject.set(pid, list);
    }
    for (const [pid, tasks] of groupedByProject) {
      triggerExclusive(request, `project-${pid}`, "tasks-created", tasks).catch(
        (e) => console.error("Pusher tasks-created failed:", e),
      );
    }

    return NextResponse.json(
      {
        created: createdTasks.map((task) => ({ ...task, timestamp: Date.now() })),
        message: "Create tasks success",
        status: 201,
      },
      { status: 201 },
    );
  },
);

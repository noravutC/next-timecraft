import { db } from "@/db";
import { columnsTable, tasksTable } from "@/db/schema";
import { getActiveColumnLinks } from "@/db/uniq-query/column/column-utils";
import { getAttachmentStoragePathsByTaskIds } from "@/db/uniq-query/comment/comment-utils";
import { removeNonMemberAssignees } from "@/db/uniq-query/task/assignee-utils";
import { getTasksByIds } from "@/db/uniq-query/task/task-utils";
import {
  getColumnRefs,
  recordTaskActivities,
} from "@/db/uniq-query/task/activity-utils";
import { diffTaskActivity } from "@/helper/utils/task-activity";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { parseIdList } from "@/lib/api/params";
import { triggerExclusive } from "@/lib/pusher-server";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { removeStorageObjects } from "@/lib/supabase-storage";
import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  updateTaskSchema,
  type UpdateTaskBody,
} from "@/validations/task.validation";

type RouteParams = { anyIds: string };

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
    const taskIds = parseIdList(params.anyIds);

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
    const destinationLinks = await getActiveColumnLinks(destinationColumnIds);
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

    // the state before the change, to record what changed
    const beforeById = new Map(
      (await getTasksByIds(targetIds)).map((t) => [t.id, t]),
    );

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
            // first archiving keeps its date and person; restoring clears them
            ...(item.archived === undefined
              ? {}
              : item.archived
                ? {
                    archivedAt: sql`coalesce(${tasksTable.archivedAt}, now())`,
                    archivedBy: sql`coalesce(${tasksTable.archivedBy}, ${userId}::uuid)`,
                  }
                : { archivedAt: null, archivedBy: null }),
            estimatedHours: item.estimatedHours,
            remindDaysBefore: item.remindDaysBefore,
            // a new date or reminder sends a fresh one
            ...(item.dueDate !== undefined || item.remindDaysBefore !== undefined
              ? { remindedAt: null }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(tasksTable.id, taskId))
          .returning();

        if (updated) rows.push(updated);
      }

      return rows;
    });

    const columnRefs = await getColumnRefs([
      ...updatedTasks.map((t) => t.columnId),
      ...[...beforeById.values()].map((t) => t.columnId),
    ]);
    await recordTaskActivities(
      userId,
      updatedTasks.flatMap((after) => {
        const before = beforeById.get(after.id);
        if (!before) return [];
        return diffTaskActivity(before, after, columnRefs).map((entry) => ({
          taskId: after.id,
          entry,
        }));
      }),
    );

    const projectByTask = new Map(
      existingTaskLinks.map((l) => [l.taskId, l.projectId]),
    );
    const projectByColumn = new Map(
      destinationLinks.map((l) => [l.columnId, l.projectId]),
    );

    const movedAcrossProjects = new Map<string, string[]>();
    for (const task of updatedTasks) {
      const to = projectByColumn.get(task.columnId);
      if (!to || to === projectByTask.get(task.id)) continue;
      movedAcrossProjects.set(to, [...(movedAcrossProjects.get(to) ?? []), task.id]);
    }
    for (const [projectId, ids] of movedAcrossProjects) {
      await removeNonMemberAssignees(ids, projectId);
    }
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

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const taskIds = parseIdList(params.anyIds);

    const existingTaskLinks = await getTaskProjectLinks(taskIds);
    if (existingTaskLinks.length === 0) {
      throw new NotFoundError("Tasks not found");
    }

    const uniqProjectIds = [
      ...new Set(existingTaskLinks.map((task) => task.projectId)),
    ];
    await authorizeOrThrow(userId, uniqProjectIds, "project:view");

    // the board each task is on, so a shared link can open it
    const projectByTask = new Map(
      existingTaskLinks.map((link) => [link.taskId, link.projectId]),
    );
    const data = (await getTasksByIds(taskIds)).map((task) => ({
      ...task,
      projectId: projectByTask.get(task.id) ?? null,
    }));

    return NextResponse.json(
      { data, message: "Get tasks success", status: 200 },
      { status: 200 },
    );
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const taskIds = parseIdList(params.anyIds);

    const existingTaskLinks = await getTaskProjectLinks(taskIds);
    if (existingTaskLinks.length === 0) {
      throw new NotFoundError("Tasks not found");
    }

    const uniqProjectIds = [
      ...new Set(existingTaskLinks.map((task) => task.projectId)),
    ];
    await authorizeOrThrow(userId, uniqProjectIds, "task:delete");

    // เก็บ path ไฟล์แนบก่อนลบ — cascade จะพาแถว attachment (และ path) หายไป
    // ถ้าไม่เก็บตอนนี้ ไฟล์ใน storage จะกลายเป็นขยะที่ตามลบย้อนหลังไม่ได้
    const attachmentPaths = await getAttachmentStoragePathsByTaskIds(taskIds);

    const deletedRows = await db
      .delete(tasksTable)
      .where(inArray(tasksTable.id, taskIds))
      .returning({ id: tasksTable.id });

    if (deletedRows.length > 0) {
      await removeStorageObjects(attachmentPaths);
    }

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

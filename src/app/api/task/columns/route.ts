import { db } from '@/db';
import {
  columnsTable,
  taskAssigneesTable,
  taskPriorityLevelEnum,
  tasksTable,
} from '@/db/schema';
import { NotFoundError } from '@/lib/api/errors';
import { createHandle } from '@/lib/api/handle';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import {
  fetchAssigneesForTasks,
  type AssigneeWithUser,
} from '@/db/uniq-query/task/assignee-utils';
import type { TaskPageInfo, TaskRow } from '@/types';
import {
  and,
  arrayOverlaps,
  asc,
  count,
  eq,
  getTableColumns,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const cursorSchema = z.object({
  orderFraction: z.string().min(1),
  id: z.string().uuid(),
});

const filterSchema = z
  .object({
    q: z.string().trim().min(1).max(200).optional(),
    priorities: z
      .array(z.enum(taskPriorityLevelEnum.enumValues))
      .max(10)
      .optional(),
    tags: z.array(z.string().min(1).max(100)).max(50).optional(),
    assigneeIds: z.array(z.string().uuid()).max(50).optional(),
  })
  .optional();

const getTasksByColumnsSchema = z.object({
  colIds: z.array(z.string().min(1)).min(1, 'colIds must be a non-empty array'),
  limit: z.number().int().positive().max(100),
  // per-column cursor: only tasks AFTER this (orderFraction, id) are returned
  cursors: z.record(z.string(), cursorSchema).optional(),
  filter: filterSchema,
});

type GetTasksByColumnsBody = z.infer<typeof getTasksByColumnsSchema>;

export const POST = createHandle<GetTasksByColumnsBody>(
  { body: getTasksByColumnsSchema },
  async ({ body, userId }) => {
    const { colIds, limit, cursors, filter } = body;

    const columnLinks = await db
      .select({ projectId: columnsTable.projectId })
      .from(columnsTable)
      .where(inArray(columnsTable.id, colIds));
    if (columnLinks.length === 0) {
      throw new NotFoundError('Columns not found');
    }

    const uniqProjectIds = [...new Set(columnLinks.map((c) => c.projectId))];
    await authorizeOrThrow(userId, uniqProjectIds, 'project:view');

    // Optional filter — must hit both the page query and the totals so the
    // cursor pagination and the WIP badge describe the same (filtered) set.
    const filterConditions: SQL[] = [];
    if (filter?.q) {
      filterConditions.push(ilike(tasksTable.title, `%${filter.q}%`));
    }
    if (filter?.priorities?.length) {
      filterConditions.push(inArray(tasksTable.priority, filter.priorities));
    }
    if (filter?.tags?.length) {
      filterConditions.push(arrayOverlaps(tasksTable.tags, filter.tags));
    }
    if (filter?.assigneeIds?.length) {
      filterConditions.push(
        inArray(
          tasksTable.id,
          db
            .select({ id: taskAssigneesTable.taskId })
            .from(taskAssigneesTable)
            .where(inArray(taskAssigneesTable.userId, filter.assigneeIds)),
        ),
      );
    }

    // Per-column filter, shifted past the cursor when one is provided.
    const perColumn = colIds.map((colId) => {
      const cursor = cursors?.[colId];
      const inColumn = eq(tasksTable.columnId, colId);
      // COLLATE "C" = byte order — ต้องตรงกับ fractional-indexing/JS ไม่งั้น
      // fraction ตัวพิมพ์ใหญ่ (แทรกบนสุด) จะถูก en_US collation จัดไปท้าย list
      return cursor
        ? and(
            inColumn,
            sql`(${tasksTable.orderFraction} COLLATE "C" > ${cursor.orderFraction} OR (${tasksTable.orderFraction} = ${cursor.orderFraction} AND ${tasksTable.id} > ${cursor.id}::uuid))`,
          )
        : inColumn;
    });

    // Window-rank tasks inside each column so one query serves any number of
    // columns with a per-column limit. limit+1 rows reveal whether more remain.
    const ranked = db
      .select({
        ...getTableColumns(tasksTable),
        rn: sql<number>`row_number() over (partition by ${tasksTable.columnId} order by ${tasksTable.orderFraction} COLLATE "C" asc, ${tasksTable.id} asc)`.as(
          'rn',
        ),
      })
      .from(tasksTable)
      .where(
        and(
          or(...perColumn),
          eq(tasksTable.archived, false),
          ...filterConditions,
        ),
      )
      .as('ranked');

    const rows = await db
      .select()
      .from(ranked)
      .where(lte(ranked.rn, limit + 1))
      .orderBy(asc(ranked.columnId), asc(ranked.rn));

    const totalRows = await db
      .select({ columnId: tasksTable.columnId, total: count() })
      .from(tasksTable)
      .where(
        and(
          inArray(tasksTable.columnId, colIds),
          eq(tasksTable.archived, false),
          ...filterConditions,
        ),
      )
      .groupBy(tasksTable.columnId);
    const totals = Object.fromEntries(
      totalRows.map((row) => [row.columnId, row.total]),
    );

    const byColumn: Record<string, typeof rows> = {};
    for (const row of rows) {
      (byColumn[row.columnId] ??= []).push(row);
    }

    const tasks: TaskRow[] = [];
    const pageInfo: Record<string, TaskPageInfo> = {};
    for (const colId of colIds) {
      const fetched = byColumn[colId] ?? [];
      const hasMore = fetched.length > limit;
      const page = hasMore ? fetched.slice(0, limit) : fetched;
      const last = page.at(-1);
      pageInfo[colId] = {
        hasMore,
        nextCursor:
          hasMore && last
            ? { orderFraction: last.orderFraction, id: last.id }
            : null,
        total: totals[colId] ?? 0,
      };
      tasks.push(...page.map(({ rn: _rn, ...task }) => task));
    }

    const assigneeRows = await fetchAssigneesForTasks(tasks.map((t) => t.id));
    const assignees: Record<string, AssigneeWithUser[]> = {};
    for (const { taskId, ...user } of assigneeRows) {
      (assignees[taskId] ??= []).push(user);
    }

    return NextResponse.json(
      {
        data: tasks,
        assignees,
        pageInfo,
        message: 'Get tasks success',
        status: 200,
      },
      { status: 200 },
    );
  },
);

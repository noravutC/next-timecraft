// app/api/task/[anyIds]/move/route.ts: POST = move a task to another board,
// at the end of its first column

import { db } from '@/db';
import { tasksTable } from '@/db/schema';
import {
  getTaskColumnLink,
  removeNonMemberAssignees,
} from '@/db/uniq-query/task/assignee-utils';
import {
  getColumnRefs,
  recordTaskActivities,
} from '@/db/uniq-query/task/activity-utils';
import {
  boardEntryPoint,
  getProjectTags,
} from '@/db/uniq-query/task/task-copy-utils';
import { getTasksByIds } from '@/db/uniq-query/task/task-utils';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { triggerExclusive } from '@/lib/pusher-server';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import {
  moveTaskToBoardSchema,
  type MoveTaskToBoardBody,
} from '@/validations/task.validation';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

type RouteParams = { anyIds: string };

export const POST = createParamHandle<RouteParams, MoveTaskToBoardBody>(
  { body: moveTaskToBoardSchema },
  async ({ params, body, userId, request }) => {
    const taskId = parseId(params.anyIds);
    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError('Task not found');
    if (link.projectId === body.projectId) {
      throw new BadRequestError('It’s already on that board');
    }
    await authorizeOrThrow(userId, [link.projectId], 'task:update');
    await authorizeOrThrow(userId, [body.projectId], 'task:create');

    const entry = await boardEntryPoint(body.projectId);
    if (!entry) throw new BadRequestError('That board has no columns yet');
    const [before] = await getTasksByIds([taskId]);
    // labels the other board doesn't have are dropped
    const boardTags = new Set(await getProjectTags(body.projectId));

    const [moved] = await db
      .update(tasksTable)
      .set({
        columnId: entry.column.id,
        orderFraction: entry.orderFraction,
        tags: (before?.tags ?? []).filter((tag) => boardTags.has(tag)),
        updatedAt: new Date(),
      })
      .where(eq(tasksTable.id, taskId))
      .returning();
    await removeNonMemberAssignees([taskId], body.projectId);

    const refs = await getColumnRefs([link.columnId, entry.column.id]);
    await recordTaskActivities(userId, [
      {
        taskId,
        entry: {
          type: 'moved',
          data: {
            from: refs.get(link.columnId) ?? null,
            to: refs.get(entry.column.id) ?? null,
          },
        },
      },
    ]);
    triggerExclusive(request, `project-${link.projectId}`, 'tasks-deleted', [
      taskId,
    ]).catch((e) => console.error('Pusher tasks-deleted failed:', e));
    triggerExclusive(request, `project-${body.projectId}`, 'tasks-created', [
      moved,
    ]).catch((e) => console.error('Pusher tasks-created failed:', e));

    return NextResponse.json(
      {
        updated: { ...moved, projectId: body.projectId },
        message: 'Task moved',
        status: 200,
      },
      { status: 200 },
    );
  },
);

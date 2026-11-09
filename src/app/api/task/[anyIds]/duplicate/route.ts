// app/api/task/[anyIds]/duplicate/route.ts: POST = copy a task right under itself

import {
  fetchAssigneesForTasks,
  getTaskColumnLink,
} from '@/db/uniq-query/task/assignee-utils';
import {
  getColumnRefs,
  recordTaskActivities,
} from '@/db/uniq-query/task/activity-utils';
import { fetchSubtaskProgress } from '@/db/uniq-query/task/subtask-progress';
import { duplicateTask } from '@/db/uniq-query/task/task-copy-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { triggerExclusive } from '@/lib/pusher-server';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import { NextResponse } from 'next/server';

type RouteParams = { anyIds: string };

export const POST = createParamHandle<RouteParams>(
  {},
  async ({ params, userId, request }) => {
    const taskId = parseId(params.anyIds);
    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError('Task not found');
    await authorizeOrThrow(userId, [link.projectId], 'task:create');

    const result = await duplicateTask(taskId);
    if (!result) throw new NotFoundError('Task not found');
    const { task, projectId } = result;

    const columnRefs = await getColumnRefs([task.columnId]);
    await recordTaskActivities(userId, [
      {
        taskId: task.id,
        entry: {
          type: 'created',
          data: { column: columnRefs.get(task.columnId) ?? null },
        },
      },
    ]);
    triggerExclusive(request, `project-${projectId}`, 'tasks-created', [
      task,
    ]).catch((e) => console.error('Pusher tasks-created failed:', e));

    const [assigneeRows, subtasks] = await Promise.all([
      fetchAssigneesForTasks([task.id]),
      fetchSubtaskProgress([task.id]),
    ]);
    return NextResponse.json(
      {
        created: { ...task, timestamp: Date.now() },
        assignees: assigneeRows.map(({ taskId: _taskId, ...user }) => user),
        subtasks,
        message: 'Task duplicated',
        status: 201,
      },
      { status: 201 },
    );
  },
);

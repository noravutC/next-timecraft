import { fetchAssigneesForTasks } from '@/db/uniq-query/task/assignee-utils';
import { recordTaskActivities } from '@/db/uniq-query/task/activity-utils';
import { fetchSubtaskProgress } from '@/db/uniq-query/task/subtask-progress';
import { refreshTasks } from '@/db/uniq-query/task/task-utils';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { useTemplate } from '@/lib/automation/manage';
import { triggerExclusive } from '@/lib/pusher-server';
import {
  useTemplateSchema,
  type UseTemplateBody,
} from '@/validations/automation.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; templateId: string };

/** A new task from a template, at the end of the column asked for. */
export const POST = createParamHandle<RouteParams, UseTemplateBody>(
  {
    body: useTemplateSchema,
    permission: 'task:create',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ request, params, body, userId }) => {
    const projectId = parseId(params.id);
    const made = await useTemplate(
      projectId,
      parseId(params.templateId),
      body.columnId,
    );
    const changedByRules = await recordTaskActivities(userId, [
      {
        taskId: made.task.id,
        entry: { type: 'created', data: { column: made.column } },
      },
    ]);
    // a rule may have changed the new task already
    const [task] = await refreshTasks([made.task], changedByRules);
    const [assigneeRows, subtasks] = await Promise.all([
      fetchAssigneesForTasks([task.id]),
      fetchSubtaskProgress([task.id]),
    ]);
    const assignees = assigneeRows.map(({ taskId: _taskId, ...user }) => user);
    const channel = `project-${projectId}`;
    triggerExclusive(request, channel, 'tasks-created', [task]).catch((e) =>
      console.error('Pusher tasks-created failed:', e),
    );
    triggerExclusive(request, channel, 'task-assignees-updated', {
      taskId: task.id,
      assignees,
    }).catch((e) => console.error('Pusher assignees failed:', e));
    triggerExclusive(request, channel, 'subtask-progress', {
      taskId: task.id,
      ...(subtasks[task.id] ?? { done: 0, total: 0 }),
    }).catch((e) => console.error('Pusher subtask-progress failed:', e));

    return NextResponse.json(
      {
        created: { ...task, timestamp: Date.now() },
        assignees,
        subtasks,
        message: 'Task created',
        status: 201,
      },
      { status: 201 },
    );
  },
);

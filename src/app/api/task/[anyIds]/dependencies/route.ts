import { getTaskColumnLink } from '@/db/uniq-query/task/assignee-utils';
import {
  addTaskDependency,
  fetchBlockerRefs,
  listTaskDependencies,
} from '@/db/uniq-query/task/dependency-utils';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { triggerExclusive } from '@/lib/pusher-server';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import { NextResponse } from 'next/server';
import {
  addDependencySchema,
  type AddDependencyBody,
} from '@/validations/task.validation';

type RouteParams = { anyIds: string };

const REFUSED = {
  self: 'A task can’t block itself',
  'other-board': 'Blockers have to be on the same board',
  loop: 'That would make the two tasks wait on each other',
} as const;

/** What blocks the task and what it blocks. */
export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const taskId = parseId(params.anyIds);
    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError('Task not found');
    await authorizeOrThrow(userId, [link.projectId], 'project:view');
    return NextResponse.json({
      data: await listTaskDependencies(taskId),
      message: 'Dependencies',
      status: 200,
    });
  },
);

/** Another task on the board now blocks this one. */
export const POST = createParamHandle<RouteParams, AddDependencyBody>(
  { body: addDependencySchema },
  async ({ request, params, body, userId }) => {
    const taskId = parseId(params.anyIds);
    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError('Task not found');
    await authorizeOrThrow(userId, [link.projectId], 'task:update');

    const result = await addTaskDependency(
      taskId,
      body.dependsOnTaskId,
      link.projectId,
    );
    if (result !== 'added') throw new BadRequestError(REFUSED[result]);

    const blockers = (await fetchBlockerRefs([taskId]))[taskId] ?? [];
    triggerExclusive(request, `project-${link.projectId}`, 'blockers-updated', {
      taskId,
      blockers,
    }).catch((e) => console.error('Pusher blockers-updated failed:', e));
    return NextResponse.json({
      data: blockers,
      message: 'Blocker added',
      status: 200,
    });
  },
);

import { getTaskColumnLink } from '@/db/uniq-query/task/assignee-utils';
import {
  fetchBlockerRefs,
  removeTaskDependency,
} from '@/db/uniq-query/task/dependency-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { triggerExclusive } from '@/lib/pusher-server';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import { NextResponse } from 'next/server';

type RouteParams = { anyIds: string; blockerId: string };

/** The task no longer waits on this one. */
export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const taskId = parseId(params.anyIds);
    const blockerId = parseId(params.blockerId);
    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError('Task not found');
    await authorizeOrThrow(userId, [link.projectId], 'task:update');

    await removeTaskDependency(taskId, blockerId);
    const blockers = (await fetchBlockerRefs([taskId]))[taskId] ?? [];
    triggerExclusive(request, `project-${link.projectId}`, 'blockers-updated', {
      taskId,
      blockers,
    }).catch((e) => console.error('Pusher blockers-updated failed:', e));
    return NextResponse.json({
      data: blockers,
      message: 'Blocker removed',
      status: 200,
    });
  },
);

import { NextResponse } from 'next/server';
import { getTaskProjectLink } from '@/db/uniq-query/comment/comment-utils';
import { listTaskActivities } from '@/db/uniq-query/task/activity-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { authorizeOrThrow } from '@/lib/rbac/authorize';

type RouteParams = { anyIds: string };

/** A task's history, newest first. `?cursor=` continues from the last page. */
export const GET = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const taskId = parseId(params.anyIds);
    const cursor = new URL(request.url).searchParams.get('cursor');

    const link = await getTaskProjectLink(taskId);
    if (!link) throw new NotFoundError('Task not found');
    await authorizeOrThrow(userId, [link.projectId], 'project:view');

    const data = await listTaskActivities(taskId, cursor);
    return NextResponse.json(
      { data, message: 'Fetch activity success', status: 200 },
      { status: 200 },
    );
  },
);

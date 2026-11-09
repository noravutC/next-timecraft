import { db } from '@/db';
import { subtasksTable } from '@/db/schema';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { getTaskColumnLink } from '@/db/uniq-query/task/assignee-utils';
import { fetchSubtasks } from '@/db/uniq-query/task/subtask-utils';
import { triggerExclusive } from '@/lib/pusher-server';
import { broadcastSubtaskProgress } from '@/lib/realtime/broadcast-subtask-progress';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import { NextResponse } from 'next/server';
import { parseId } from '@/lib/api/params';
import {
  createSubtaskSchema,
  type CreateSubtaskBody,
} from '@/validations/subtask.validation';

type RouteParams = { anyIds: string };

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const taskId = parseId(params.anyIds);
    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError('Task not found');

    await authorizeOrThrow(userId, [link.projectId], 'project:view');

    const data = await fetchSubtasks(taskId);
    return NextResponse.json(
      { data, message: 'Fetch subtasks success', status: 200 },
      { status: 200 },
    );
  },
);

export const POST = createParamHandle<RouteParams, CreateSubtaskBody>(
  { body: createSubtaskSchema },
  async ({ request, params, body, userId }) => {
    const taskId = parseId(params.anyIds);
    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError('Task not found');

    await authorizeOrThrow(userId, [link.projectId], 'task:update');

    const orderFraction = body.orderFraction?.trim() || 'a0';

    const [created] = await db
      .insert(subtasksTable)
      .values({ taskId, title: body.title, orderFraction })
      .returning();

    triggerExclusive(request, `task-${taskId}`, 'subtask-added', created).catch(
      (e) => console.error('Pusher subtask-added failed:', e),
    );
    broadcastSubtaskProgress(request, link.projectId, taskId).catch((e) =>
      console.error('Pusher subtask-progress failed:', e),
    );

    return NextResponse.json(
      { created, message: 'Create subtask success', status: 201 },
      { status: 201 },
    );
  },
);

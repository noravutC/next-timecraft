import { db } from '@/db';
import { tasksTable } from '@/db/schema';
import { getTaskColumnLink } from '@/db/uniq-query/task/assignee-utils';
import { recordTaskActivities } from '@/db/uniq-query/task/activity-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { triggerExclusive } from '@/lib/pusher-server';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logTimeSchema, type LogTimeBody } from '@/validations/task.validation';

type RouteParams = { anyIds: string };

/** Adds time spent on the task; the log shows up in its Activity. */
export const POST = createParamHandle<RouteParams, LogTimeBody>(
  { body: logTimeSchema },
  async ({ request, params, body, userId }) => {
    const taskId = parseId(params.anyIds);
    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError('Task not found');
    await authorizeOrThrow(userId, [link.projectId], 'task:update');

    // added in SQL, so two people logging at once both count
    const [updated] = await db
      .update(tasksTable)
      .set({
        loggedMinutes: sql`${tasksTable.loggedMinutes} + ${body.minutes}`,
        updatedAt: new Date(),
      })
      .where(eq(tasksTable.id, taskId))
      .returning();
    if (!updated) throw new NotFoundError('Task not found');

    await recordTaskActivities(userId, [
      {
        taskId,
        entry: {
          type: 'time_logged',
          data: {
            minutes: body.minutes,
            day: body.day,
            ...(body.note ? { note: body.note } : {}),
          },
        },
      },
    ]);
    triggerExclusive(request, `project-${link.projectId}`, 'tasks-updated', [
      updated,
    ]).catch((e) => console.error('Pusher tasks-updated failed:', e));

    return NextResponse.json({
      data: updated,
      message: 'Time logged',
      status: 200,
    });
  },
);

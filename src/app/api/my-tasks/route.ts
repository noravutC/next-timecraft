import { listMyTasks } from '@/db/uniq-query/task/my-tasks';
import { createHandle } from '@/lib/api/handle';
import { NextResponse } from 'next/server';

/** Everything assigned to you, on every board you're on. */
export const GET = createHandle({}, async ({ userId }) =>
  NextResponse.json({
    data: await listMyTasks(userId),
    message: 'My tasks',
    status: 200,
  }),
);

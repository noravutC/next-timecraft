import { markNotificationsRead } from '@/db/uniq-query/notification/notification-utils';
import { createHandle } from '@/lib/api/handle';
import {
  markNotificationsReadSchema,
  type MarkNotificationsReadBody,
} from '@/validations/notification.validation';
import { NextResponse } from 'next/server';

// per-user resource: the helper only touches the session user's rows
export const POST = createHandle<MarkNotificationsReadBody>(
  { body: markNotificationsReadSchema },
  async ({ userId, body }) => {
    const updated = await markNotificationsRead(
      userId,
      body.all ? 'all' : (body.ids ?? []),
    );
    return NextResponse.json(
      {
        created: { updated },
        message: body.all ? 'Marked all read' : 'Marked read',
        status: 200,
      },
      { status: 200 },
    );
  },
);

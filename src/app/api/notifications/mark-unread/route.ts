import { markNotificationsUnread } from '@/db/uniq-query/notification/notification-utils';
import { createHandle } from '@/lib/api/handle';
import {
  notificationIdsSchema,
  type NotificationIdsBody,
} from '@/validations/notification.validation';
import { NextResponse } from 'next/server';

// per-user resource: the helper only touches the session user's rows
export const POST = createHandle<NotificationIdsBody>(
  { body: notificationIdsSchema },
  async ({ userId, body }) => {
    const updated = await markNotificationsUnread(userId, body.ids);
    return NextResponse.json(
      { created: { updated }, message: 'Marked unread', status: 200 },
      { status: 200 },
    );
  },
);

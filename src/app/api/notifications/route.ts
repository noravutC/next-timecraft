import {
  countUnreadNotifications,
  fetchNotificationsPage,
} from '@/db/uniq-query/notification/notification-utils';
import { createHandle } from '@/lib/api/handle';
import { NextResponse } from 'next/server';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// per-user resource: every query is scoped to the session user
export const GET = createHandle({}, async ({ request, userId }) => {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  const unreadOnly = url.searchParams.get('unreadOnly') === '1';
  const rawLimit = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const [page, unreadCount] = await Promise.all([
    fetchNotificationsPage({ userId, cursor, limit, unreadOnly }),
    countUnreadNotifications(userId),
  ]);

  return NextResponse.json(
    {
      data: { ...page, unreadCount },
      message: 'Fetch notifications success',
      status: 200,
    },
    { status: 200 },
  );
});

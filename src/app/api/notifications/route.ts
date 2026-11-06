import {
  countNotificationKinds,
  countUnreadNotifications,
  deleteNotifications,
  fetchNotificationsPage,
} from '@/db/uniq-query/notification/notification-utils';
import {
  kindCounts,
  NOTIFICATION_KINDS,
  type NotificationKind,
} from '@/helper/utils/notification-view';
import { createHandle } from '@/lib/api/handle';
import { isUuid } from '@/lib/api/params';
import {
  notificationIdsSchema,
  type NotificationIdsBody,
} from '@/validations/notification.validation';
import { NextResponse } from 'next/server';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const isKind = (value: string | null): value is NotificationKind =>
  value !== null && value in NOTIFICATION_KINDS;

// per-user resource: every query is scoped to the session user.
// ?kind=mentions|assigned|invites|unread and ?projectId= narrow the list;
// ?counts=1 adds the per-kind totals the notifications page shows
export const GET = createHandle({}, async ({ request, userId }) => {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  const kind = url.searchParams.get('kind');
  const rawProject = url.searchParams.get('projectId');
  const projectId = rawProject && isUuid(rawProject) ? rawProject : null;
  const unreadOnly =
    url.searchParams.get('unreadOnly') === '1' || kind === 'unread';
  const rawLimit = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const types = isKind(kind) ? NOTIFICATION_KINDS[kind] : null;

  const [page, unreadCount, counts] = await Promise.all([
    fetchNotificationsPage({
      userId,
      cursor,
      limit,
      unreadOnly,
      types: types ? [...types] : undefined,
      projectId,
    }),
    countUnreadNotifications(userId),
    url.searchParams.get('counts') === '1'
      ? countNotificationKinds(userId, projectId).then(kindCounts)
      : Promise.resolve(undefined),
  ]);

  return NextResponse.json(
    {
      data: { ...page, unreadCount, counts },
      message: 'Fetch notifications success',
      status: 200,
    },
    { status: 200 },
  );
});

// dismiss: the user's own notifications only
export const DELETE = createHandle<NotificationIdsBody>(
  { body: notificationIdsSchema },
  async ({ userId, body }) => {
    const deleted = await deleteNotifications(userId, body.ids);
    return NextResponse.json(
      { deleted, message: 'Dismissed', status: 200 },
      { status: 200 },
    );
  },
);

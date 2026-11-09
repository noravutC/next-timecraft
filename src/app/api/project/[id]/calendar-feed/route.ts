import { getOrCreateCalendarFeed } from '@/db/uniq-query/project/calendar-utils';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { calendarFeedUrl } from '@/lib/calendar-feed';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** Your secret iCal link for this board (made on first ask). */
export const POST = createParamHandle<RouteParams>(
  {
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, userId }) => {
    const token = await getOrCreateCalendarFeed(userId, parseId(params.id));
    return NextResponse.json({
      data: { url: calendarFeedUrl(token) },
      message: 'Calendar feed',
      status: 200,
    });
  },
);

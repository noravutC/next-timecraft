import {
  findCalendarFeed,
  getFeedContents,
} from '@/db/uniq-query/project/calendar-utils';
import { clientIp } from '@/lib/api/client-ip';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { feedEvents, isFeedToken } from '@/lib/calendar-feed';
import { authorize } from '@/lib/rbac/authorize';
import { buildIcal } from '@/helper/utils/ical';

type Context = { params: Promise<{ token: string }> };

const notFound = () => new Response('Not found', { status: 404 });

// calendar apps poll every so often; this only stops scripted guessing
const FEED_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

/**
 * A board's due dates as an iCal feed, for calendar apps. The token is the
 * only credential, so it's checked against a person still on the board.
 */
export async function GET(request: Request, context: Context) {
  if (!checkRateLimit(`cal:${clientIp(request)}`, FEED_RATE_LIMIT).ok) {
    return new Response('Too many requests', { status: 429 });
  }
  const token = (await context.params).token.replace(/\.ics$/, '');
  if (!isFeedToken(token)) return notFound();
  const feed = await findCalendarFeed(token);
  if (
    !feed ||
    !(await authorize(feed.userId, [feed.projectId], 'project:view'))
  ) {
    return notFound();
  }
  const contents = await getFeedContents(feed.projectId);
  if (!contents) return notFound();

  const ics = buildIcal({
    name: `${contents.name} · TimeCraft`,
    now: new Date(),
    events: feedEvents({
      projectId: feed.projectId,
      timeZone: contents.timeZone,
      tasks: contents.tasks.flatMap((t) =>
        t.dueDate ? [{ ...t, dueDate: t.dueDate }] : [],
      ),
    }),
  });
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'private, max-age=600',
    },
  });
}

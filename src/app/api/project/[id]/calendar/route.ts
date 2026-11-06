import { listCalendarTasks } from '@/db/uniq-query/project/calendar-utils';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { NextResponse } from 'next/server';
import {
  calendarRangeSchema,
  type CalendarRangeBody,
} from '@/validations/task.validation';

type RouteParams = { id: string };

/** A board's tasks for the calendar: due in the range, and undated ones. */
export const POST = createParamHandle<RouteParams, CalendarRangeBody>(
  {
    body: calendarRangeSchema,
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body, userId }) => {
    const data = await listCalendarTasks({
      projectId: parseId(params.id),
      userId,
      from: new Date(body.from),
      to: new Date(body.to),
      filter: body.filter,
      hideUndatedIn: body.hideUndatedIn,
    });
    return NextResponse.json({ data, message: 'Calendar', status: 200 });
  },
);

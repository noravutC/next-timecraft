import { getBoardInsights } from '@/db/uniq-query/project/insights-utils';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import {
  insightsRequestSchema,
  type InsightsRequestBody,
} from '@/validations/project.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** A board's numbers for the Insights view, over the last 4 or 12 weeks. */
export const POST = createParamHandle<RouteParams, InsightsRequestBody>(
  {
    body: insightsRequestSchema,
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body }) => {
    const data = await getBoardInsights({
      projectId: parseId(params.id),
      weeks: body.weeks,
      tz: body.timeZone,
    });
    return NextResponse.json({ data, message: 'Insights', status: 200 });
  },
);

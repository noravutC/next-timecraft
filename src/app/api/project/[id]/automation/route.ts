import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { getBoardAutomation, sinceOf } from '@/lib/automation/manage';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** A board's rules, templates and webhooks, as this person may see them. */
export const GET = createParamHandle<RouteParams>(
  {
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ request, params, userId, session }) => {
    const data = await getBoardAutomation(
      parseId(params.id),
      userId,
      session,
      sinceOf(new URL(request.url).searchParams, new Date()),
    );
    return NextResponse.json({ data, message: 'Automation', status: 200 });
  },
);

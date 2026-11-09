import { countBoardTags } from '@/db/uniq-query/task/tag-utils';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** How many tasks use each tag, for Board settings › Tags. */
export const GET = createParamHandle<RouteParams>(
  {
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params }) =>
    NextResponse.json({
      data: await countBoardTags(parseId(params.id)),
      message: 'Tag counts',
      status: 200,
    }),
);

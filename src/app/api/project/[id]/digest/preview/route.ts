import { render } from '@react-email/components';
import { getDigestBoard } from '@/db/uniq-query/project/digest-utils';
import { currentWeekKey } from '@/helper/utils/insights';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { buildWeeklyDigest } from '@/lib/email/weekly-digest';

type RouteParams = { id: string };

/** This week's digest for the board as a page: "See an example". */
export const GET = createParamHandle<RouteParams>(
  {
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params }) => {
    const projectId = parseId(params.id);
    const board = await getDigestBoard(projectId);
    if (!board) throw new NotFoundError('Board not found');
    const digest = await buildWeeklyDigest(
      projectId,
      currentWeekKey(new Date(), board.timeZone),
    );
    if (!digest) throw new NotFoundError('This board has no Done column');
    return new Response(await render(digest.email), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  },
);

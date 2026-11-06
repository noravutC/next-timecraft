import { getBoardExport } from '@/db/uniq-query/project/export-utils';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { boardToCsv, boardToJson, exportFileName } from '@/lib/board-export';

type RouteParams = { id: string };

/** The board as a file: ?format=csv (a task list) or json (everything). */
export const GET = createParamHandle<RouteParams>(
  {
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ request, params }) => {
    const format = new URL(request.url).searchParams.get('format');
    if (format !== 'csv' && format !== 'json') {
      throw new BadRequestError('Format must be csv or json');
    }
    const data = await getBoardExport(parseId(params.id));
    if (!data) throw new NotFoundError('Board not found');

    // the BOM tells Excel the CSV is UTF-8, so Thai text opens readable
    const body =
      format === 'csv' ? `\uFEFF${boardToCsv(data)}` : boardToJson(data);
    return new Response(body, {
      headers: {
        'Content-Type':
          format === 'csv'
            ? 'text/csv; charset=utf-8'
            : 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exportFileName(data.board.name, format)}"`,
        'Cache-Control': 'no-store',
      },
    });
  },
);

import { listHistory } from '@/db/uniq-query/automation/history-utils';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { historyFilterOf } from '@/lib/automation/manage';
import { authorize } from '@/lib/rbac/authorize';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** What rules did and what webhooks were sent, newest first. */
export const GET = createParamHandle<RouteParams>(
  {
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ request, params, userId }) => {
    const projectId = parseId(params.id);
    const filter = historyFilterOf(new URL(request.url).searchParams);
    // messages name their webhook's address: only for those who manage them
    const canManage = await authorize(userId, [projectId], 'automation:manage');
    const data = await listHistory(
      projectId,
      canManage ? filter : { ...filter, kind: 'rules' },
    );
    return NextResponse.json({ data, message: 'History', status: 200 });
  },
);

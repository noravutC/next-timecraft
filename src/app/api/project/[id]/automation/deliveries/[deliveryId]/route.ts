import { requeueDelivery } from '@/db/uniq-query/automation/webhook-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { deliverWebhooks } from '@/lib/automation/deliver';
import { refuseGuests } from '@/lib/automation/manage';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; deliveryId: string };

/** "Send again now": one message that was not accepted, tried afresh. */
export const POST = createParamHandle<RouteParams>(
  {
    permission: 'automation:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
    rateLimit: { limit: 20, windowMs: 60_000 },
  },
  async ({ params, session }) => {
    refuseGuests(session);
    const deliveryId = parseId(params.deliveryId);
    const now = new Date();
    if (!(await requeueDelivery(deliveryId, parseId(params.id), now))) {
      throw new NotFoundError('Nothing to send again');
    }
    await deliverWebhooks(now, [deliveryId]);
    return NextResponse.json({ updated: true, message: 'Sent', status: 200 });
  },
);

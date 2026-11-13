import { isAccepted } from '@/helper/utils/webhook';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { refuseGuests, testWebhook } from '@/lib/automation/manage';
import {
  testWebhookSchema,
  type TestWebhookBody,
} from '@/validations/automation.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** "Send a test": a hello to an address, and how it was received. */
export const POST = createParamHandle<RouteParams, TestWebhookBody>(
  {
    body: testWebhookSchema,
    permission: 'automation:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
    // each one is a request to someone else's server
    rateLimit: { limit: 10, windowMs: 60_000 },
  },
  async ({ params, body, session }) => {
    refuseGuests(session);
    const result = await testWebhook(parseId(params.id), body);
    return NextResponse.json({
      data: { ...result, accepted: isAccepted(result.status) },
      message: 'Test sent',
      status: 200,
    });
  },
);

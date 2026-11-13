import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { createWebhook, refuseGuests } from '@/lib/automation/manage';
import {
  saveWebhookSchema,
  type SaveWebhookBody,
} from '@/validations/automation.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** A new webhook on this board. Its secret is never sent back. */
export const POST = createParamHandle<RouteParams, SaveWebhookBody>(
  {
    body: saveWebhookSchema,
    permission: 'automation:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body, userId, session }) => {
    refuseGuests(session);
    const created = await createWebhook(parseId(params.id), userId, body);
    return NextResponse.json(
      { created, message: 'Webhook added', status: 201 },
      { status: 201 },
    );
  },
);

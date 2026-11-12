import { deleteWebhook } from '@/db/uniq-query/automation/webhook-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { changeWebhook, refuseGuests } from '@/lib/automation/manage';
import {
  updateWebhookSchema,
  type UpdateWebhookBody,
} from '@/validations/automation.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; webhookId: string };

export const PATCH = createParamHandle<RouteParams, UpdateWebhookBody>(
  {
    body: updateWebhookSchema,
    permission: 'automation:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body, session }) => {
    refuseGuests(session);
    const updated = await changeWebhook(
      parseId(params.id),
      parseId(params.webhookId),
      body,
    );
    return NextResponse.json({
      updated,
      message: 'Webhook saved',
      status: 200,
    });
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {
    permission: 'automation:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params }) => {
    const deleted = await deleteWebhook(
      parseId(params.webhookId),
      parseId(params.id),
    );
    if (!deleted) throw new NotFoundError('Webhook not found');
    return NextResponse.json({
      deleted,
      message: 'Webhook deleted',
      status: 200,
    });
  },
);

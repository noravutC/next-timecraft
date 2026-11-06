// POST /api/pusher/auth: pusher-js asks here before joining a private channel
import { BadRequestError, ForbiddenError } from '@/lib/api/errors';
import { createHandle } from '@/lib/api/handle';
import { canSubscribe } from '@/lib/pusher-auth';
import { pusherServer } from '@/lib/pusher-server';
import { pusherChannelAuthSchema } from '@/validations/pusher.validation';
import { NextResponse } from 'next/server';

export const POST = createHandle({}, async ({ request, userId }) => {
  const form = await request.formData().catch(() => null);
  const parsed = pusherChannelAuthSchema.safeParse(
    form ? Object.fromEntries(form) : {},
  );
  if (!parsed.success)
    throw new BadRequestError('Invalid channel auth request');

  const { socket_id, channel_name } = parsed.data;
  if (!(await canSubscribe(userId, channel_name))) throw new ForbiddenError();

  // raw Pusher payload ({ auth }), not the usual envelope: pusher-js reads it as-is
  return NextResponse.json(
    pusherServer.authorizeChannel(socket_id, channel_name),
  );
});

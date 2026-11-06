// POST /api/pusher/user-auth: binds the socket to the session user, which
// lets the server terminate that user's connections (e.g. on member removal)
import { BadRequestError } from '@/lib/api/errors';
import { createHandle } from '@/lib/api/handle';
import { pusherServer } from '@/lib/pusher-server';
import { pusherUserAuthSchema } from '@/validations/pusher.validation';
import { NextResponse } from 'next/server';

export const POST = createHandle({}, async ({ request, userId }) => {
  const form = await request.formData().catch(() => null);
  const parsed = pusherUserAuthSchema.safeParse(
    form ? Object.fromEntries(form) : {},
  );
  if (!parsed.success) throw new BadRequestError('Invalid user auth request');

  // raw Pusher payload ({ auth, user_data }), read as-is by pusher-js
  return NextResponse.json(
    pusherServer.authenticateUser(parsed.data.socket_id, { id: userId }),
  );
});

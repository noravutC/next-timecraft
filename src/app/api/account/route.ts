// app/api/account/route.ts: PATCH = edit your profile, DELETE = delete your account

import {
  deleteAccount,
  updateDisplayName,
} from '@/db/uniq-query/user/account-utils';
import { BadRequestError, ForbiddenError } from '@/lib/api/errors';
import { createHandle } from '@/lib/api/handle';
import { isGuestSession } from '@/lib/guest';
import { removeStorageObjects } from '@/lib/supabase-storage';
import {
  deleteAccountSchema,
  updateProfileSchema,
  type DeleteAccountBody,
  type UpdateProfileBody,
} from '@/validations/user.validation';
import { NextResponse } from 'next/server';

// every guest visitor shares this account
const GUEST_MESSAGE = 'The guest demo account can’t be changed';

export const PATCH = createHandle<UpdateProfileBody>(
  { body: updateProfileSchema },
  async ({ body, userId, session }) => {
    if (isGuestSession(session)) throw new ForbiddenError(GUEST_MESSAGE);
    const updated = await updateDisplayName(userId, body.fullName);
    return NextResponse.json(
      { updated, message: 'Profile updated', status: 200 },
      { status: 200 },
    );
  },
);

export const DELETE = createHandle<DeleteAccountBody>(
  { body: deleteAccountSchema },
  async ({ body, userId, session }) => {
    if (isGuestSession(session)) throw new ForbiddenError(GUEST_MESSAGE);
    const email = session.user?.email?.toLowerCase();
    if (!email || body.confirmEmail.toLowerCase() !== email) {
      throw new BadRequestError('Type your email to confirm');
    }

    const storagePaths = await deleteAccount(userId, {
      boards: body.boards,
      workspace: body.workspace,
    });
    await removeStorageObjects(storagePaths);

    return NextResponse.json(
      { deleted: true, message: 'Account deleted', status: 200 },
      { status: 200 },
    );
  },
);

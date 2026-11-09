// app/api/account/notification-prefs/route.ts: GET / PATCH what reaches you

import {
  getNotificationPrefs,
  updateNotificationPrefs,
} from '@/db/uniq-query/user/account-utils';
import { ForbiddenError } from '@/lib/api/errors';
import { createHandle } from '@/lib/api/handle';
import { isGuestSession } from '@/lib/guest';
import {
  updateNotificationPrefsSchema,
  type UpdateNotificationPrefsBody,
} from '@/validations/user.validation';
import { NextResponse } from 'next/server';

export const GET = createHandle({}, async ({ userId }) => {
  const data = await getNotificationPrefs(userId);
  return NextResponse.json(
    { data, message: 'Get preferences success', status: 200 },
    { status: 200 },
  );
});

export const PATCH = createHandle<UpdateNotificationPrefsBody>(
  { body: updateNotificationPrefsSchema },
  async ({ userId, body, session }) => {
    // everyone in the demo shares one account: settings stay put
    if (isGuestSession(session)) {
      throw new ForbiddenError('The guest demo’s settings can’t be changed');
    }
    const updated = await updateNotificationPrefs(userId, body);
    return NextResponse.json(
      { updated, message: 'Preferences saved', status: 200 },
      { status: 200 },
    );
  },
);

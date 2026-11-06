// app/api/account/deletion/route.ts: GET = what deleting your account affects

import { getAccountDeletionPlan } from '@/db/uniq-query/user/account-utils';
import { createHandle } from '@/lib/api/handle';
import { NextResponse } from 'next/server';

export const GET = createHandle({}, async ({ userId }) => {
  const data = await getAccountDeletionPlan(userId);
  return NextResponse.json(
    { data, message: 'Get deletion plan success', status: 200 },
    { status: 200 },
  );
});

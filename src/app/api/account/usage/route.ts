import { createHandle } from '@/lib/api/handle';
import { getDailyUsage } from '@/lib/api/usage';
import { NextResponse } from 'next/server';

/** The signed-in person's use of each daily limit, for Settings › Usage. */
export const GET = createHandle({}, async ({ request, session, userId }) =>
  NextResponse.json({
    data: await getDailyUsage({ request, session, userId }),
    message: 'Usage',
    status: 200,
  }),
);

// app/api/cron/run/route.ts: POST = run the scheduled jobs (reminders,
// notification emails, weekly digests, purging deleted columns). Called every few minutes
// by .github/workflows/run-jobs.yml with the CRON_SECRET.

import { timingSafeEqual } from 'crypto';
import { runJobs } from '@/lib/jobs/run-jobs';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

const matches = (given: string, secret: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given =
    request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!secret || !matches(given, secret)) {
    return NextResponse.json(
      { message: 'Unauthorized', status: 401 },
      { status: 401 },
    );
  }
  try {
    const data = await runJobs();
    logger.info(data, 'scheduled jobs ran');
    return NextResponse.json(
      { data, message: 'Jobs ran', status: 200 },
      { status: 200 },
    );
  } catch (err) {
    logger.error({ err }, 'scheduled jobs failed');
    return NextResponse.json(
      { message: 'Jobs failed', status: 500 },
      { status: 500 },
    );
  }
}

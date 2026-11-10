import { toRouteKey } from '@/helper/utils/route-key';
import { clientIp } from '@/lib/api/client-ip';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';
import { recordWebVital, WEB_VITAL_NAMES } from '@/lib/telemetry/metrics';
import { z } from 'zod';

const vitalSchema = z.object({
  name: z.enum(WEB_VITAL_NAMES),
  value: z.number().min(0).max(600_000),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  path: z.string().max(300),
});

// a page load reports five metrics, plus INP/CLS updates
const VITALS_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

// Core Web Vitals from real browsers (WebVitalsReporter). Not wrapped in
// createHandle: the landing and login pages report too, before any session.
// So it is limited per IP, takes only this small shape and stores nothing.
export async function POST(request: Request) {
  if (!checkRateLimit(`vitals:${clientIp(request)}`, VITALS_RATE_LIMIT).ok) {
    return new Response(null, { status: 429 });
  }

  const parsed = vitalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });

  const { name, value, rating } = parsed.data;
  // ids/tokens collapsed, like the request log
  const page = `/${toRouteKey(parsed.data.path)}`;
  recordWebVital(name, value, page, rating);
  logger.info({ name, value, rating, page }, 'web vital');

  return new Response(null, { status: 204 });
}

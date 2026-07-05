import { db } from "@/db";
import { logger } from "@/lib/logger";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Intentionally NOT wrapped in createHandle: health checks must be reachable
// without a session (Docker HEALTHCHECK, load balancers, uptime monitors).
export async function GET() {
  let dbOk = false;
  try {
    await db.execute(sql`select 1`);
    dbOk = true;
  } catch (error) {
    logger.error({ err: error }, "health db check failed");
  }

  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "up" : "down",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 },
  );
}

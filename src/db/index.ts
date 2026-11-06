import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { sslFor } from "./ssl";

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

// Dev hot reload re-runs this module. Without one client per process, every
// reload opened a new pool and the old one kept its connections until the
// Supabase pooler ran out of slots.
const globalForDb = globalThis as { pgClient?: ReturnType<typeof postgres> };

let _db: DrizzleDB | undefined;

function getDb(): DrizzleDB {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const client = (globalForDb.pgClient ??= postgres(connectionString, {
    prepare: false,
    ssl: sslFor(connectionString),
    // hand idle connections back to the pooler, which dev and prod share
    idle_timeout: 20,
  }));
  _db = drizzle(client, { schema });
  return _db;
}

export const db = new Proxy({} as DrizzleDB, {
  get(_, prop) {
    return getDb()[prop as keyof DrizzleDB];
  },
});

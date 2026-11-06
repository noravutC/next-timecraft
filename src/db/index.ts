import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDB | undefined;

// Supabase is reached over the internet, so the connection must be
// encrypted (postgres.js defaults to plaintext). Local Postgres (docker
// compose `db`, localhost) has no TLS and is exempt. `require` = encrypt
// without CA pinning; Supabase's cert isn't in Node's default CA store.
const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "db"]);
const sslFor = (connectionString: string) => {
  try {
    const { hostname } = new URL(connectionString);
    return LOCAL_DB_HOSTS.has(hostname) ? false : "require";
  } catch {
    return "require"; // unparsable URL: stay on the safe side
  }
};

function getDb(): DrizzleDB {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const client = postgres(connectionString, {
    prepare: false,
    ssl: sslFor(connectionString),
  });
  _db = drizzle(client, { schema });
  return _db;
}

export const db = new Proxy({} as DrizzleDB, {
  get(_, prop) {
    return getDb()[prop as keyof DrizzleDB];
  },
});

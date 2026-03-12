import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

type PostgresClient = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var __drizzleQueryClient__: PostgresClient | undefined;
}

const queryClient =
  globalThis.__drizzleQueryClient__ ??
  postgres(connectionString, {
    // Supabase transaction pooler requires prepared statements disabled.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__drizzleQueryClient__ = queryClient;
}

export const db = drizzle(queryClient, { schema });
export { queryClient };

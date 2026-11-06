import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { withSslMode } from "./db/ssl";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // encrypted like the app's own connection (see db/ssl.ts)
    url: withSslMode(process.env.DATABASE_URL),
  },
});

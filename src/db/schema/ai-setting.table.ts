import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { aiProviderEnum } from "./enums";
import { usersTable } from "./user.table";

// One row per user. API keys are stored AES-256-GCM encrypted
// (src/lib/ai/crypto.ts) — never plaintext, never returned to the client.
export const aiSettingsTable = pgTable("ai_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  provider: aiProviderEnum("provider").notNull().default("claude"),
  claudeKeyEncrypted: text("claude_key_encrypted"),
  geminiKeyEncrypted: text("gemini_key_encrypted"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

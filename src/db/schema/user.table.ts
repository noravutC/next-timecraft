import { sql } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { StoredNotificationPrefs } from "@/helper/utils/notification-prefs";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    avatar: text("avatar"),
    provider: text("provider").notNull().default("google"),
    providerId: text("provider_id").notNull(),
    // set when the account is deleted: the row stays, scrubbed, so comments
    // and history keep an author shown as "Former member"
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    // what reaches them, and where: see helper/utils/notification-prefs
    notificationPrefs: jsonb("notification_prefs")
      .$type<StoredNotificationPrefs>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    providerUnique: uniqueIndex("users_provider_provider_id_unique").on(
      table.provider,
      table.providerId,
    ),
  }),
);

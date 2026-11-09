import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { organizationMembershipRoleEnum } from './enums';
import { organizationsTable } from './organization.table';
import { usersTable } from './user.table';

// Workspace invitations, by token. Like board invitations, the status is
// derived from the timestamps: pending = not accepted or revoked, not expired.
export const organizationInvitationsTable = pgTable(
  'organization_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: organizationMembershipRoleEnum('role').notNull().default('member'),
    token: text('token').notNull(),
    invitedBy: uuid('invited_by').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tokenUnique: uniqueIndex('organization_invitations_token_unique').on(
      table.token,
    ),
    organizationEmailIdx: index('organization_invitations_org_email_idx').on(
      table.organizationId,
      table.email,
    ),
  }),
);

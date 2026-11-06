import { z } from "zod";

export const lookUpUsersSchema = z.object({
  userIds: z.array(z.guid()).min(1).max(100),
});

export type LookUpUsersBody = z.infer<typeof lookUpUsersSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(80),
});

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

const deletionChoice = z.enum(["transfer", "delete"]);

export const deleteAccountSchema = z.object({
  /** the account's email, typed to confirm */
  confirmEmail: z.string().trim().max(255),
  boards: z.record(z.guid(), deletionChoice).default({}),
  workspace: deletionChoice.optional(),
});

export type DeleteAccountBody = z.infer<typeof deleteAccountSchema>;

const channels = z
  .object({ app: z.boolean().optional(), email: z.boolean().optional() })
  .strict();

export const updateNotificationPrefsSchema = z
  .object({
    email: z.boolean().optional(),
    kinds: z
      .object({
        mentions: channels.optional(),
        replies: channels.optional(),
        assigned: channels.optional(),
        due: channels.optional(),
        roles: channels.optional(),
        accepted: channels.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type UpdateNotificationPrefsBody = z.infer<
  typeof updateNotificationPrefsSchema
>;

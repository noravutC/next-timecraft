import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.email().max(255),
  role: z.enum(["admin", "editor", "viewer"]),
});

export type InviteMemberBody = z.infer<typeof inviteMemberSchema>;

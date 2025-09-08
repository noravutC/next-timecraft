import { z } from "zod";

export const MembershipSchema = z.object({
  userId: z.string().nonempty(),
  role: z.enum(["owner", "admin", "member", "guest"]),
  organizationId: z.string().nonempty(),
});

export type MembershipType = z.infer<typeof MembershipSchema>;

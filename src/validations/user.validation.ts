import { z } from "zod";

export const lookUpUsersSchema = z.object({
  userIds: z.array(z.guid()).min(1).max(100),
});

export type LookUpUsersBody = z.infer<typeof lookUpUsersSchema>;

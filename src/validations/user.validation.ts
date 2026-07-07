import { z } from "zod";

export const lookUpUsersSchema = z.object({
  userIds: z.array(z.string()).min(1),
});

export type LookUpUsersBody = z.infer<typeof lookUpUsersSchema>;

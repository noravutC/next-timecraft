import { z } from "zod";

export const OrganizationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  createdBy: z.string().min(1).nonempty(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;
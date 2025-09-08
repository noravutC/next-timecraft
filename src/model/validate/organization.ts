import { z } from "zod";

export const OrganizationSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().optional(),
  createdBy: z.string().nonempty(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;
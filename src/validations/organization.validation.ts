import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required').max(100),
  description: z.string().trim().max(1000).nullable().optional(),
});

export type CreateOrganizationBody = z.infer<typeof createOrganizationSchema>;

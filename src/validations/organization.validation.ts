import { z } from 'zod';

// What the logo picker produces: a small square PNG, JPEG or WebP data URL.
// Never a remote URL, which would load a tracking image for every member.
const WORKSPACE_LOGO_PATTERN =
  /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/]+=*$/;
const MAX_WORKSPACE_LOGO_LENGTH = 200_000;

const workspaceLogo = z
  .string()
  .max(MAX_WORKSPACE_LOGO_LENGTH, 'Logo is too large')
  .regex(WORKSPACE_LOGO_PATTERN, 'Logo must be a PNG, JPEG or WebP image');

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required').max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  logo: workspaceLogo.nullable().optional(),
});

export type CreateOrganizationBody = z.infer<typeof createOrganizationSchema>;

import { z } from 'zod';
import { isTimeZone } from '@/helper/utils/time-zone';
import { WORKSPACE_INVITABLE_ROLES } from '@/lib/rbac/workspace-permissions';

// What the logo picker produces: a small square PNG, JPEG or WebP data URL.
// Never a remote URL, which would load a tracking image for every member.
const WORKSPACE_LOGO_PATTERN =
  /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/]+=*$/;
const MAX_WORKSPACE_LOGO_LENGTH = 200_000;

const workspaceLogo = z
  .string()
  .max(MAX_WORKSPACE_LOGO_LENGTH, 'Logo is too large')
  .regex(WORKSPACE_LOGO_PATTERN, 'Logo must be a PNG, JPEG or WebP image');

const workspaceName = z
  .string()
  .trim()
  .min(1, 'Organization name is required')
  .max(100);

const timeZone = z.string().max(64).refine(isTimeZone, 'Unknown time zone');

export const createOrganizationSchema = z.object({
  name: workspaceName,
  description: z.string().trim().max(1000).nullable().optional(),
  logo: workspaceLogo.nullable().optional(),
  timeZone: timeZone.optional(),
});

export type CreateOrganizationBody = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  name: workspaceName.optional(),
  logo: workspaceLogo.nullable().optional(),
  timeZone: timeZone.optional(),
});

export type UpdateOrganizationBody = z.infer<typeof updateOrganizationSchema>;

// the onboarding step and the members page send a few addresses at once
export const MAX_WORKSPACE_INVITES_PER_REQUEST = 20;

export const inviteToWorkspaceSchema = z.object({
  emails: z
    .array(z.email().max(255))
    .min(1)
    .max(MAX_WORKSPACE_INVITES_PER_REQUEST),
  role: z.enum(WORKSPACE_INVITABLE_ROLES),
});

export type InviteToWorkspaceBody = z.infer<typeof inviteToWorkspaceSchema>;

export const changeWorkspaceRoleSchema = z.object({
  role: z.enum(WORKSPACE_INVITABLE_ROLES),
});

export type ChangeWorkspaceRoleBody = z.infer<typeof changeWorkspaceRoleSchema>;

export const addWorkspaceGuestSchema = z.object({ userId: z.guid() });

export type AddWorkspaceGuestBody = z.infer<typeof addWorkspaceGuestSchema>;

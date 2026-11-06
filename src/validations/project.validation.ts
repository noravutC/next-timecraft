import { z } from 'zod';

const DATA_URL_IMAGE_PATTERN =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/;
const MAX_PROJECT_COVER_IMAGE_LENGTH = 2_900_000;

const projectName = z.string().max(100);
const projectDescription = z.string().max(2000);
const projectTags = z.array(z.string().trim().min(1).max(64)).max(30);

export const normalizeCoverImage = (value?: string | null) => {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
};

export const isValidProjectCoverImage = (value: string) => {
  if (value.length > MAX_PROJECT_COVER_IMAGE_LENGTH) return false;
  // data URLs only (what the cover picker produces): a remote URL would let
  // a board admin load a tracking image in every member's browser
  return DATA_URL_IMAGE_PATTERN.test(value);
};

export const projectRequestSchema = z.union([
  z.object({
    mode: z.literal('create'),
    project: z
      .object({
        name: projectName.optional(),
        description: projectDescription.optional(),
        coverImage: z.string().nullable().optional(),
        archived: z.boolean().optional(),
        tags: projectTags.optional(),
      })
      .optional(),
  }),
  z.object({
    mode: z.literal('fetch').optional(),
    fetchAll: z.boolean().optional(),
    projectIds: z
      .union([z.string().max(4000), z.array(z.guid()).max(100)])
      .optional(),
  }),
]);

export type ProjectRequestBody = z.infer<typeof projectRequestSchema>;

export const updateProjectSchema = z.object({
  name: projectName.optional(),
  description: projectDescription.optional(),
  coverImage: z.string().nullable().optional(),
  tags: projectTags.optional(),
  archived: z.boolean().optional(),
  settings: z.unknown().optional(),
});

export type UpdateProjectBody = z.infer<typeof updateProjectSchema>;

export const changeMemberRoleSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']),
});

export type ChangeMemberRoleBody = z.infer<typeof changeMemberRoleSchema>;

export const transferOwnershipSchema = z.object({ userId: z.guid() });

export type TransferOwnershipBody = z.infer<typeof transferOwnershipSchema>;

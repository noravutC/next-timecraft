import { z } from 'zod';

const DATA_URL_IMAGE_PATTERN =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/;
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;
const MAX_PROJECT_COVER_IMAGE_LENGTH = 2_900_000;

export const normalizeCoverImage = (value?: string | null) => {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
};

export const isValidProjectCoverImage = (value: string) => {
  if (value.length > MAX_PROJECT_COVER_IMAGE_LENGTH) return false;
  return DATA_URL_IMAGE_PATTERN.test(value) || HTTP_URL_PATTERN.test(value);
};

export const projectRequestSchema = z.union([
  z.object({
    mode: z.literal('create'),
    project: z
      .object({
        name: z.string().optional(),
        description: z.string().optional(),
        coverImage: z.string().nullable().optional(),
        archived: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      })
      .optional(),
  }),
  z.object({
    mode: z.literal('fetch').optional(),
    fetchAll: z.boolean().optional(),
    projectIds: z.union([z.string(), z.array(z.string())]).optional(),
  }),
]);

export type ProjectRequestBody = z.infer<typeof projectRequestSchema>;

export const updateProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
  settings: z.unknown().optional(),
});

export type UpdateProjectBody = z.infer<typeof updateProjectSchema>;

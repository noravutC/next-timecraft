import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color');

export const projectSettingsSchema = z
  .object({
    icon: z.string().min(1).max(32).optional(),
    color: hexColor.optional(),
    isPrivate: z.boolean().optional(),
    tagColors: z.record(z.string(), hexColor).optional(),
    nextTagColor: hexColor.optional(),
  })
  .strict();

export type ProjectSettings = z.infer<typeof projectSettingsSchema>;

export const DEFAULT_PROJECT_SETTINGS: Required<ProjectSettings> = {
  icon: 'shield',
  color: '#3b82f6',
  isPrivate: false,
  tagColors: {},
  nextTagColor: '#10b981',
};

export const withSettingsDefaults = (
  settings?: ProjectSettings | null,
): Required<ProjectSettings> => ({
  ...DEFAULT_PROJECT_SETTINGS,
  ...(settings ?? {}),
  tagColors: {
    ...DEFAULT_PROJECT_SETTINGS.tagColors,
    ...(settings?.tagColors ?? {}),
  },
});

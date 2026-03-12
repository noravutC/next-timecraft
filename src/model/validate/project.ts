import { z } from "zod";

export const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  coverImage: z.string().optional().nullable(),
  ownerId: z.string().min(1),
  members: z.array(z.object({
    userId: z.string(),
    role: z.enum(["owner", "admin", "editor", "viewer"]).optional(),
    joinedAt: z.date().optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
});

export type ProjectFormType = z.infer<typeof ProjectSchema>;

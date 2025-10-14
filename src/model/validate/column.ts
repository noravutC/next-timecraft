import { z } from "zod";

export const ColumnSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  wipLimit: z.number().min(5).optional(),
  order: z.number().min(0),
});

export type ColumnType = z.infer<typeof ColumnSchema>;

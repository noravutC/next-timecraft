import { z } from 'zod';

const MAX_TITLE_LEN = 500;
const orderFraction = z.string().trim().max(255);

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(MAX_TITLE_LEN),
  // '' falls back to the default key in the route
  orderFraction: orderFraction.optional(),
});

export type CreateSubtaskBody = z.infer<typeof createSubtaskSchema>;

export const updateSubtaskSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_TITLE_LEN).optional(),
    completed: z.boolean().optional(),
    orderFraction: orderFraction.min(1).optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.completed !== undefined ||
      v.orderFraction !== undefined,
    'At least one field is required',
  );

export type UpdateSubtaskBody = z.infer<typeof updateSubtaskSchema>;

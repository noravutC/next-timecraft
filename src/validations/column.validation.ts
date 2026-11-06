import { z } from 'zod';
import { MAX_IDS_PER_REQUEST } from '@/lib/api/params';

const columnName = z.string().trim().min(1).max(100);
const columnColor = z.string().trim().max(32);
const wipLimit = z.number().int().min(0).max(10_000);

export const createColumnSchema = z
  .array(
    z.object({
      projectId: z.guid(),
      name: columnName,
      color: columnColor.optional(),
      wipLimit: wipLimit.optional(),
    }),
  )
  .min(1, 'Payload must be a non-empty array')
  .max(MAX_IDS_PER_REQUEST);

export type CreateColumnBody = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z
  .array(
    z.object({
      id: z.guid(),
      name: columnName.optional(),
      color: columnColor.optional(),
      wipLimit: wipLimit.optional(),
      orderFraction: z.string().max(255).optional(),
    }),
  )
  .min(1, 'Payload must be a non-empty array')
  .max(MAX_IDS_PER_REQUEST);

export type UpdateColumnBody = z.infer<typeof updateColumnSchema>;

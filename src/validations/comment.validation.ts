import { z } from 'zod';
import { MAX_FILES_PER_COMMENT } from '@/helper/utils/attachment-kinds';

export const MAX_COMMENT_BODY_LEN = 5000;
const MAX_MENTIONS = 50;

const mentions = z.array(z.guid()).max(MAX_MENTIONS).optional().default([]);

const attachmentSchema = z.object({
  type: z.enum(['image', 'video', 'file']),
  // shown on file chips; display only, the storage path is server-built
  fileName: z.string().trim().min(1).max(200).nullable().optional(),
  storagePath: z.string().min(1).max(512),
  url: z.string().url().max(1024),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  durationMs: z.number().int().positive().nullable().optional(),
});

export const createCommentSchema = z
  .object({
    body: z.string().trim().max(MAX_COMMENT_BODY_LEN).default(''),
    mentions,
    clientId: z.string().trim().min(1, 'clientId is required').max(64),
    attachments: z
      .array(attachmentSchema)
      .max(MAX_FILES_PER_COMMENT)
      .optional()
      .default([]),
  })
  .refine((d) => d.body.trim().length > 0 || d.attachments.length > 0, {
    message: 'Comment must have body or at least one attachment',
    path: ['body'],
  });

export type CreateCommentBody = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  body: z.string().trim().min(1, 'Body is required').max(MAX_COMMENT_BODY_LEN),
  mentions,
});

export type UpdateCommentBody = z.infer<typeof updateCommentSchema>;

export const markCommentsReadSchema = z.object({
  lastReadCommentId: z.guid().nullable().optional(),
});

export type MarkCommentsReadBody = z.infer<typeof markCommentsReadSchema>;

export const commentReactionSchema = z.object({
  emoji: z.string().min(1).max(16),
});

export type CommentReactionBody = z.infer<typeof commentReactionSchema>;

export const commentUploadUrlSchema = z.object({
  taskId: z.guid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
});

export type CommentUploadUrlBody = z.infer<typeof commentUploadUrlSchema>;

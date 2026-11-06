import { z } from 'zod';
import { taskPriorityLevelEnum } from '@/db/schema/enums';
import { MAX_IDS_PER_REQUEST } from '@/lib/api/params';

export const MAX_TASK_TITLE_LEN = 500;
export const MAX_TASK_DESCRIPTION_LEN = 20_000;

const priority = z.enum(['low', 'medium', 'high']);
const tags = z.array(z.string().trim().min(1).max(64)).max(30);
const orderFraction = z.string().trim().max(255);
const dateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date');

export const createTaskSchema = z
  .array(
    z.object({
      columnId: z.guid(),
      title: z.string().trim().min(1).max(MAX_TASK_TITLE_LEN),
      description: z
        .string()
        .trim()
        .max(MAX_TASK_DESCRIPTION_LEN)
        .nullable()
        .optional(),
      orderFraction: orderFraction.optional(),
      tags: tags.optional(),
      priority: priority.optional(),
      dueDate: dateString.nullable().optional(),
    }),
  )
  .min(1, 'Payload must be a non-empty array')
  .max(MAX_IDS_PER_REQUEST);

export type CreateTaskBody = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .array(
    z.object({
      id: z.guid(),
      columnId: z.guid().optional(),
      title: z.string().max(MAX_TASK_TITLE_LEN).optional(),
      description: z
        .string()
        .max(MAX_TASK_DESCRIPTION_LEN)
        .nullable()
        .optional(),
      orderFraction: orderFraction.optional(),
      tags: tags.optional(),
      priority: priority.optional(),
      dueDate: dateString.nullable().optional(),
      archived: z.boolean().optional(),
      estimatedHours: z.number().int().min(0).max(10_000).optional(),
      // days before the due date to remind assignees; null for none
      remindDaysBefore: z.number().int().min(0).max(30).nullable().optional(),
    }),
  )
  .min(1, 'Payload must be a non-empty array')
  .max(MAX_IDS_PER_REQUEST);

export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;

const cursorSchema = z.object({
  orderFraction: z.string().min(1).max(255),
  id: z.guid(),
});

const dueBucketSchema = z.enum(['overdue', 'this_week', 'later', 'none']);

// the viewer's local midnight and the Monday after, for the due buckets
const dueBoundsSchema = z.object({
  today: z.iso.datetime(),
  weekEnd: z.iso.datetime(),
});

const filterSchema = z
  .object({
    q: z.string().trim().min(1).max(200).optional(),
    priorities: z
      .array(z.enum(taskPriorityLevelEnum.enumValues))
      .max(10)
      .optional(),
    tags: z.array(z.string().min(1).max(100)).max(50).optional(),
    assigneeIds: z.array(z.guid()).max(50).optional(),
    mine: z.boolean().optional(),
    unassigned: z.boolean().optional(),
    due: z.array(dueBucketSchema).max(4).optional(),
    dueBounds: dueBoundsSchema.optional(),
  })
  .optional();

export const getTasksByColumnsSchema = z.object({
  colIds: z
    .array(z.guid())
    .min(1, 'colIds must be a non-empty array')
    .max(MAX_IDS_PER_REQUEST),
  limit: z.number().int().positive().max(100),
  // per-column cursor: only tasks AFTER this (orderFraction, id) are returned
  cursors: z
    .record(z.guid(), cursorSchema)
    .refine(
      (c) => Object.keys(c).length <= MAX_IDS_PER_REQUEST,
      'Too many cursors',
    )
    .optional(),
  filter: filterSchema,
});

export type GetTasksByColumnsBody = z.infer<typeof getTasksByColumnsSchema>;

export const filterCountsSchema = z.object({
  colIds: z.array(z.guid()).min(1).max(MAX_IDS_PER_REQUEST),
  dueBounds: dueBoundsSchema,
});

export type FilterCountsBody = z.infer<typeof filterCountsSchema>;

export const updateAssigneesSchema = z.object({
  userIds: z.array(z.guid()).max(50).default([]),
});

export type UpdateAssigneesBody = z.infer<typeof updateAssigneesSchema>;

export const moveTaskToBoardSchema = z.object({ projectId: z.guid() });

export type MoveTaskToBoardBody = z.infer<typeof moveTaskToBoardSchema>;

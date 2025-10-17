import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

const ChecklistSchema = z.object({
  text: z.string().min(1, "Checklist text is required"),
  done: z.boolean().default(false),
});

const AttachmentSchema = z.object({
  url: z.string().url("Invalid attachment URL"),
  uploadedBy: objectId,
  uploadedAt: z.date().default(() => new Date()),
});

const CommentSchema = z.object({
  userId: objectId,
  text: z.string().min(1, "Comment text is required"),
  createdAt: z.date().default(() => new Date()),
});

const TimeTrackingSchema = z.object({
  estimated: z.number().min(0).default(0),
  logged: z.number().min(0).default(0),
});

// ✅ TaskSchema (สอดคล้องกับ TasksModel)
export const SchemaTask = z.object({
  columnId: objectId,
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),

  assignees: z.array(objectId).default([]),

  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .default("medium"),

  status: z
    .enum(["active", "archived", "done"])
    .default("active"),

  dueDate: z.date().optional(),
  startDate: z.date().optional(),

  checklist: z.array(ChecklistSchema).default([]),
  attachments: z.array(AttachmentSchema).default([]),
  comments: z.array(CommentSchema).default([]),
  timeTracking: TimeTrackingSchema.default({ estimated: 0, logged: 0 }),

  dependencies: z.array(objectId).default([]),
});

export type TaskFormType = z.infer<typeof SchemaTask>;

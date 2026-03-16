import { Schema, model, models } from "mongoose";

// SubSchemas
const ChecklistSchema = new Schema(
  { text: { type: String }, done: { type: Boolean, default: false } },
  { _id: false },
);

const AttachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const CommentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const TimeTrackingSchema = new Schema(
  {
    estimated: { type: Number, default: 0 }, // ชั่วโมง
    logged: { type: Number, default: 0 },
  },
  { _id: false },
);

const TasksSchema = new Schema(
  {
    columnId: {
      type: Schema.Types.ObjectId,
      ref: "Column",
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String },

    assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    dueDate: { type: Date },

    tags: [{ type: String, default: [] }],

    order: { type: Number, required: true, default: 1 },

    archived: { type: Boolean, default: false },

    // คุณยังใช้ checklist / attachment / comments / timeTracking ต่อได้
    checklist: { type: [ChecklistSchema], default: [] },
    attachments: { type: [AttachmentSchema], default: [] },
    comments: { type: [CommentSchema], default: [] },
    timeTracking: { type: TimeTrackingSchema, default: {} },
    dependencies: [{ type: Schema.Types.ObjectId, ref: "Task" }],
  },
  { timestamps: true },
);

export const TasksModel = models.Tasks || model("Tasks", TasksSchema, "tasks");

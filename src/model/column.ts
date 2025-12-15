import { Schema, model, models } from "mongoose";

const ColumnsSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: { type: String, required: true },
    color: { type: String, default: "#CBD5E1" }, // gray-300 default
    wipLimit: { type: Number, default: 0 },
    order: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // Auto-delete after X days (30 or 60 days)
    purgeAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ColumnsModel =
  models.Columns || model("Columns", ColumnsSchema, "columns");

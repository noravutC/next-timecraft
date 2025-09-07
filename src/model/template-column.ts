import { Schema, model, models } from "mongoose";

const TemplateColumnSchema = new Schema(
  {
    name: { type: String, required: true }, // เช่น "Standard Kanban"
    description: { type: String },
    columns: [
      {
        name: { type: String, required: true },
        color: { type: String, default: "#CBD5E1" },
        wipLimit: { type: Number, default: 0 },
        order: { type: Number, default: 0 },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const TemplateColumn =
  models.TemplateColumn ||
  model("TemplateColumn", TemplateColumnSchema, "templateColumns");

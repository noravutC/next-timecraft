// // models/Project.ts

import { Schema, model, models } from "mongoose";

const MemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "editor", "viewer"],
      default: "viewer",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProjectsSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [MemberSchema], default: [] },
    tags: { type: [String], default: [] },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ProjectsModel =
  models.Projects || model("Projects", ProjectsSchema, "projects");

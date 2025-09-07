import { Schema, model, models, Types } from "mongoose";

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },

    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Organization =
  models.Organization ||
  model("Organization", OrganizationSchema, "organizations");

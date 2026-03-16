import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    provider: { type: String, default: "google" },
    providerId: { type: String, required: true },
  },
  { timestamps: true },
);

export const UsersModel = models.User || model("User", UserSchema, "users");

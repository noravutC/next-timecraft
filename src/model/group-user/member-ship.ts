// model/member-ship.ts
import { Schema, Types, model, models } from "mongoose";

const MembershipSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member", "guest"],
      default: "member",
    },
  },
  { timestamps: true },
);

MembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export const MembershipModel =
  models.Membership || model("Membership", MembershipSchema, "memberships");

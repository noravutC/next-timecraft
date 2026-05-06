import { connectDB } from "@/lib/mongodb";
import { BadRequestError, ForbiddenError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { MembershipModel } from "@/model/group-user/member-ship";
import { NextResponse } from "next/server";

type RouteParams = { userId: string };

const normalizeMembership = (membership: Record<string, unknown>) => {
  const idLike = (v: unknown): string =>
    typeof v === "object" && v !== null && "toString" in v
      ? (v as { toString(): string }).toString()
      : String(v ?? "");
  return {
    _id: idLike(membership._id),
    userId: idLike(membership.userId),
    organizationId: idLike(membership.organizationId),
    role: membership.role as string,
    createdAt: membership.createdAt as Date,
    updatedAt: membership.updatedAt as Date,
  };
};

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, userId: sessionUserId }) => {
    const { userId } = params;
    if (!userId) throw new BadRequestError("userId is required");
    if (userId !== sessionUserId) throw new ForbiddenError();

    await connectDB();

    const memberships = await MembershipModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        data: memberships.map((m) =>
          normalizeMembership(m as unknown as Record<string, unknown>),
        ),
        message: "Get memberships success",
        status: 200,
      },
      { status: 200 },
    );
  },
);

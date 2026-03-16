import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { MembershipModel } from "@/model/group-user/member-ship";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const normalizeMembership = (membership: any) => ({
  _id: membership._id.toString(),
  userId: membership.userId?.toString?.() ?? membership.userId,
  organizationId:
    membership.organizationId?.toString?.() ?? membership.organizationId,
  role: membership.role,
  createdAt: membership.createdAt,
  updatedAt: membership.updatedAt,
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        data: [],
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 },
    );
  }

  const { userId } = await params;

  if (!userId) {
    return NextResponse.json(
      {
        data: [],
        message: "userId is required",
        status: 400,
      },
      { status: 400 },
    );
  }

  if (userId !== sessionUserId) {
    return NextResponse.json(
      {
        data: [],
        message: "Forbidden",
        status: 403,
      },
      { status: 403 },
    );
  }

  try {
    await connectDB();

    const memberships = await MembershipModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        data: memberships.map(normalizeMembership),
        message: "Get memberships success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch memberships:", error);
    return NextResponse.json(
      {
        data: [],
        message: "Failed to fetch memberships",
        status: 500,
      },
      { status: 500 },
    );
  }
}

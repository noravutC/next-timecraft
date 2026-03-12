import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { MembershipModel } from "@/model/group-user/member-ship";
import { OrganizationsModel } from "@/model/group-user/organization";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

type CreateMembershipBody = {
  userId?: string;
  organizationId?: string;
  role?: "owner" | "admin" | "member" | "guest";
};

const normalizeMembership = (membership: any) => ({
  _id: membership._id.toString(),
  userId: membership.userId?.toString?.() ?? membership.userId,
  organizationId:
    membership.organizationId?.toString?.() ?? membership.organizationId,
  role: membership.role,
  createdAt: membership.createdAt,
  updatedAt: membership.updatedAt,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        created: null,
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as CreateMembershipBody;
    const userId = body.userId ?? "";
    const organizationId = body.organizationId ?? "";
    const role = body.role ?? "member";

    if (!userId || !organizationId) {
      return NextResponse.json(
        {
          created: null,
          message: "userId and organizationId are required",
          status: 400,
        },
        { status: 400 }
      );
    }

    if (userId !== sessionUserId) {
      return NextResponse.json(
        {
          created: null,
          message: "Forbidden",
          status: 403,
        },
        { status: 403 }
      );
    }

    await connectDB();

    const organization = await OrganizationsModel.findById(organizationId);
    if (!organization) {
      return NextResponse.json(
        {
          created: null,
          message: "Organization not found",
          status: 404,
        },
        { status: 404 }
      );
    }

    const membership = await MembershipModel.findOneAndUpdate(
      { userId, organizationId },
      {
        $setOnInsert: {
          userId,
          organizationId,
          role,
        },
      },
      {
        upsert: true,
        new: true,
      }
    ).lean();

    if (!membership) {
      return NextResponse.json(
        {
          created: null,
          message: "Failed to create membership",
          status: 500,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        created: normalizeMembership(membership),
        message: "Create membership success",
        status: 201,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create membership:", error);
    return NextResponse.json(
      {
        created: null,
        message: "Failed to create membership",
        status: 500,
      },
      { status: 500 }
    );
  }
}

// app/api/member-ship/[userId]/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { MembershipModel } from "@/model/group-user/member-ship";
import { type Membership as MembershipProps  } from "@/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { Types } from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Not  authenticated",
        data: [],
      },
      { status: 401 }
    );
  }
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }
    await connectDB();
    const userObjectId = new Types.ObjectId(userId); // แปลงเป็น ObjectId
    const membership: MembershipProps[] = await MembershipModel.find({ userId: userObjectId });
    return NextResponse.json(
      {
        success: true,
        message: "Get membership by user id success",
        data: membership,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get membership by ID:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get membership by ID",
        error: error,
      },
      { status: 500 }
    );
  }
}

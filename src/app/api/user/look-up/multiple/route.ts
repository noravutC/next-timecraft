// app/api/user/look-up/multiple/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { UsersModel } from "@/model/group-user/user";
import { type User as UserType } from "@/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function POST(request: Request) {
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
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User IDs are required for looking up users",
        },
        { status: 400 }
      );
    }

    const normalized = userIds.map((id: string) => ({
      _id: new ObjectId(id),
    }));
    await connectDB();
    // const objectIds = userIds.map((id: string) => new ObjectId(id));

    const users: UserType[] = await UsersModel.find({
      _id: { $in: normalized },
    });
    return NextResponse.json(
      {
        success: true,
        message: "Get users by Ids success",
        data: users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get users by ids:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get user by ids",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}

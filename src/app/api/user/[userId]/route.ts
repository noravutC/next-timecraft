// app/api/user/[userId]/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { UsersModel } from "@/model/group-user/user";
import { type User as UserType } from "@/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(
  request: Request,
  context: { params: { userId: string } }
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
    const { userId } = await context.params

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required for get users",
        },
        { status: 400 }
      );
    }
    await connectDB();
    const response = await UsersModel.find({
      _id: new ObjectId(userId),
    }).lean<UserType[]>().exec();
    return NextResponse.json(
      {
        success: true,
        message: "Success to get users by userId!",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get users by userId:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get users by userId",
        error: error,
      },
      { status: 500 }
    );
  }
}

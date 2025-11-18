// app/api/user/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { UsersModel } from "@/model/group-user/user";
// import { TemplateColumnModel } from "@/model/template-column";
import { type User } from "@/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET() {
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
    await connectDB();

    const response = await UsersModel.find().lean<User[]>().exec();
    return NextResponse.json(
      {
        success: true,
        message: "Get users organization success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error users organization:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get users organization",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}
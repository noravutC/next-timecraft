// app/api/task/look-up/column/[columnId]/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { TasksModel } from "@/model/task";
import { type Task } from "@/types/task";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> }
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
    const { columnId } = await params;

    if (!columnId) {
      return NextResponse.json(
        {
          success: false,
          message: "Column ID is required for get tasks",
        },
        { status: 400 }
      );
    }
    await connectDB();
    const response  = await TasksModel.find({
      columnId: new ObjectId(columnId),
    }).lean<Task>().exec();

    return NextResponse.json(
      {
        success: true,
        message: "Get tasks by column id success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get tasks by columnId:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get tasks by columnId",
        error: error,
      },
      { status: 500 }
    );
  }
}

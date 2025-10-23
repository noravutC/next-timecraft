// app/api/task/[taskId]/move/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { TasksModel } from "@/model/task";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import mongoose from "mongoose";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
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
    const { taskId } = await params;
    const body = await request.json();
    console.log("Request body:", body);

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Task ID is required for move tasks",
        },
        { status: 400 }
      );
    }

    await connectDB();
    const moveTask = await TasksModel.findByIdAndUpdate(
      taskId,
      { columnId: new mongoose.Types.ObjectId(body.columnId) },
      { new: true }
    );

    if (!moveTask) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found",
          updated: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Move task to column is success",
        updated: moveTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error move task to column:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed move task to column",
        updated: null,
        error: error,
      },
      { status: 500 }
    );
  }
}

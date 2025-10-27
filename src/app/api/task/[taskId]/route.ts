// app/api/task/[taskId]/route.ts
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
    const { ...updateFields } = body;
    // console.log("Request body:", body);

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Task ID is required for move tasks",
        },
        { status: 400 }
      );
    }

   if (body.assignees && Array.isArray(body.assignees)) {
        updateFields.assignees = body.assignees.map((id: string) => new mongoose.Types.ObjectId(id));
    }
    // console.log('updatedTaskField: ', updatedTaskField);
    await connectDB();
    const updatedTask = await TasksModel.findByIdAndUpdate(
      taskId,
      updateFields,
      { new: true }
    );
    if (!updatedTask) {
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
        message: "Updated task is success",
        updated: updatedTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error update task:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed update task",
        updated: null,
        error: error,
      },
      { status: 500 }
    );
  }
}

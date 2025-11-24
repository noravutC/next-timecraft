// // app/api/task/[taskId]/move/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { TasksModel } from "@/model/task";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import mongoose from "mongoose";
import { pusherServer } from "@/lib/pusher-server";

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
    // console.log("Request body:", body);
    const { projectId, columnId } = body;
    if (!taskId || !projectId || !columnId) { 
      return NextResponse.json(
        {
          success: false,
          message: "Task ID, Project ID, and Column ID are required for move tasks",
        },
        { status: 400 }
      );
    }

    await connectDB();
    const moveTask = await TasksModel.findByIdAndUpdate(
      taskId,
      { columnId: new mongoose.Types.ObjectId(columnId) },
      { new: true }
    ).lean();

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

    // 💡 PUSHER TRIGGER LOGIC:
    const channelName = `project-${projectId}`; 
    const eventName = 'task-updated'; // ใช้ event 'task-updated'

    // ส่ง Task object ที่อัปเดตแล้วไปยัง Frontend
    await pusherServer.trigger(
      channelName,
      eventName,
      moveTask 
    );

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

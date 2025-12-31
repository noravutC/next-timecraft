// app/api/column/look-up/project/[projectId]/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { ColumnsModel } from "@/model/column";
import { Column } from "@/types/column";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { TasksModel } from "@/model/task";
import { Task } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const taskLimit = 20; //first time get task it's 20 task per 1 column
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
  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json(
      {
        success: false,
        message: "Project ID is required for get columns",
      },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    const columnsWithTasks = await ColumnsModel.aggregate([
      {
        $match: {
          projectId: new ObjectId(projectId),
          isDeleted: false,
        },
      },
      {
        $sort: { order: 1 },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "columnId",
          as: "tasks",
          pipeline: [
            {
              $match: {
                archived: false,
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $limit: taskLimit,
            },
            {
              $project: {
                title: 1,
                columnId: 1,
                assignees: 1,
                order: 1,
                priority: 1,
                status: 1,
                dueDate: 1,
                timeTracking: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);
    console.log("columnsWithTasks: ", columnsWithTasks);
    return NextResponse.json(
      {
        success: true,
        message: "Get columns by project id success",
        data: columnsWithTasks,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get columns by projectId:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get columns by projectId",
        error: error,
      },
      { status: 500 }
    );
  }
}

// app/api/column/map/task/[Id]/route.ts
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { ColumnsModel } from "@/model/column";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ColumnMapTask } from "@/types/column-map";
import { TaskCache } from "@/types/task";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ Id: string }> }
) {
  const taskLimit = 20;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated", data: [] },
      { status: 401 }
    );
  }

  const { Id } = await params;

  if (!Id) {
    return NextResponse.json(
      { success: false, message: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const rawColumns = await ColumnsModel.aggregate([
      {
        $match: {
          projectId: new ObjectId(Id),
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
                    projectId: 1,
                    description: 1,
                    assignees: 1,
                    order: 1,
                    priority: 1,
                    dueDate: 1,
                    tags: 1,
                    archived: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    // timeTracking: 1, // ถ้า Interface Task ไม่มี field นี้ อาจจะไม่ต้องส่ง หรือต้องเพิ่มใน Interface
                }
            }
          ],
        },
      },
    ]);

    const formattedData: ColumnMapTask[] = rawColumns.map((col) => {
      
      const taskMap: { [key: string]: TaskCache } = {};

      if (col.tasks && Array.isArray(col.tasks)) {
        col.tasks.forEach((task: any) => {
          const taskId = task._id.toString();
          
          taskMap[taskId] = {
            _id: taskId,
            projectId: task.projectId?.toString(),
            columnId: task.columnId?.toString(),
            title: task.title,
            description: task.description,
            assignees: task.assignees?.map((a: any) => a.toString()) || [],
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            tags: task.tags || [],
            order: task.order,
            archived: task.archived,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            timestamp: Date.now(),
          };
        });
      }

      return {
        _id: col._id.toString(),
        projectId: col.projectId.toString(),
        name: col.name,
        color: col.color,
        wipLimit: col.wipLimit,
        order: col.order,
        createdAt: new Date(col.createdAt),
        updatedAt: new Date(col.updatedAt),
        timestamp: Date.now(),
        taskInColumn: taskMap,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Get column map tasks by project id success",
        data: formattedData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get column map tasks by projectId:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get column map tasks by projectId",
        error: error,
      },
      { status: 500 }
    );
  }
}
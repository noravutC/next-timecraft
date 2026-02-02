// app/api/task/[taskId]/move/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { TasksModel } from "@/model/task";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { pusherServer } from "@/lib/pusher-server";
import { PayloadMoveTask, Task } from "@/types";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  try {
    const { taskId } = await params;
    const body = await request.json();
    
    if (!body.jsonPayload) return NextResponse.json({ message: "Missing payload" }, { status: 400 });

    const payload: PayloadMoveTask = JSON.parse(body.jsonPayload);
    await connectDB();

    const activeTaskId = payload.activeTaskId || taskId;
    const destinationColumnId = new ObjectId(payload.columnDestination);
    const newOrder = Number(payload.orderDestination);

    // 1. ดึงข้อมูล Task ตัวที่ถูกย้าย (ตัวเดียวพอ ไม่ต้องดึงทั้ง Column)
    const activeTask = await TasksModel.findById(activeTaskId).lean<Task>();
    if (!activeTask) return NextResponse.json({ message: "Task not found" }, { status: 404 });

    const sourceColumnId = new ObjectId(activeTask.columnId);
    const oldOrder = activeTask.order;
    const isSameColumn = sourceColumnId.equals(destinationColumnId);

    const bulkOps = [];

    // --- LOGIC การคำนวณแบบใช้ Database (ไม่ต้อง Loop ใน JS) ---

    if (isSameColumn) {
      if (oldOrder < newOrder) {
        bulkOps.push({
          updateMany: {
            filter: {
              columnId: sourceColumnId,
              order: { $gt: oldOrder, $lte: newOrder },
              _id: { $ne: activeTask._id }
            },
            update: { $inc: { order: -1 } }
          }
        });
      } else if (oldOrder > newOrder) {
        bulkOps.push({
          updateMany: {
            filter: {
              columnId: sourceColumnId,
              order: { $gte: newOrder, $lt: oldOrder },
              _id: { $ne: activeTask._id }
            },
            update: { $inc: { order: 1 } } // เพิ่ม Order ขึ้น 1
          }
        });
      }
    } else {
      bulkOps.push({
        updateMany: {
          filter: {
            columnId: sourceColumnId,
            order: { $gt: oldOrder }
          },
          update: { $inc: { order: -1 } }
        }
      });

      bulkOps.push({
        updateMany: {
          filter: {
            columnId: destinationColumnId,
            order: { $gte: newOrder }
          },
          update: { $inc: { order: 1 } }
        }
      });
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: new ObjectId(activeTaskId) },
        update: {
          $set: {
            columnId: destinationColumnId,
            order: newOrder
          }
        }
      }
    });

    if (bulkOps.length > 0) {
      await TasksModel.bulkWrite(bulkOps);
    }

    const updatedActiveTask = await TasksModel.findById(activeTaskId).lean();

    const channelName = `project-${payload.projectId}`;
    
    await pusherServer.trigger(channelName, "task-moved", {
       task: updatedActiveTask,
       oldColumnId: sourceColumnId,
       newColumnId: destinationColumnId,
       oldOrder: oldOrder,
       newOrder: newOrder
    });

    return NextResponse.json(
      {
        success: true,
        message: "Move task success",
        data: updatedActiveTask, // ส่งกลับแค่ตัวเดียวพอ
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error move task:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

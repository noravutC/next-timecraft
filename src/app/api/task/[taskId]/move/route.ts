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
    if (!body.jsonPayload) {
        return NextResponse.json(
        {
          success: false,
          message: "Cannot update unknow payload.",
          data: [],
        },
        { status: 400 }
      );
    }
    const payload: PayloadMoveTask = JSON.parse(body.jsonPayload);

    await connectDB();
    const activeTaskId = payload.activeTaskId || taskId;
    const activeTask = await TasksModel.findById(activeTaskId).lean<Task>();
    if (!activeTask) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found",
          data: [],
        },
        { status: 404 }
      );
    }

    const destinationColumnId = new ObjectId(payload.columnDestination);
    const orderDestination = Number(payload.orderDestination);

    if (!payload.columnDestination || Number.isNaN(orderDestination) || orderDestination < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid destination column or order.",
          data: [],
        },
        { status: 400 }
      );
    }

    const sourceColumnId = new ObjectId(activeTask.columnId);
    const sourceTasks = await TasksModel.find({ columnId: sourceColumnId })
      .sort({ order: 1 })
      .lean<Task[]>();

    const destinationTasks = sourceColumnId.equals(destinationColumnId)
      ? sourceTasks
      : await TasksModel.find({ columnId: destinationColumnId })
          .sort({ order: 1 })
          .lean<Task[]>();

    const activeTaskIdStr = activeTaskId.toString();
    const clampIndex = (value: number, max: number) => Math.max(0, Math.min(value, max));

    const isSameColumn = sourceColumnId.equals(destinationColumnId);
    let newSourceTasks: Task[] = [];
    let newDestinationTasks: Task[] = [];

    if (isSameColumn) {
      const remaining = sourceTasks.filter((t) => t._id.toString() !== activeTaskIdStr);
      const insertIndex = clampIndex(orderDestination - 1, remaining.length);
      remaining.splice(insertIndex, 0, activeTask);
      newSourceTasks = remaining;
      newDestinationTasks = remaining;
    } else {
      newSourceTasks = sourceTasks.filter((t) => t._id.toString() !== activeTaskIdStr);
      const destList = destinationTasks.filter((t) => t._id.toString() !== activeTaskIdStr);
      const insertIndex = clampIndex(orderDestination - 1, destList.length);
      destList.splice(insertIndex, 0, { ...activeTask, columnId: destinationColumnId.toString() });
      newDestinationTasks = destList;
    }

    const bulkOps: Array<{ updateOne: { filter: { _id: any }; update: { $set: Record<string, unknown> } } }> = [];
    const updatedIds = new Set<string>();

    newSourceTasks.forEach((task, index) => {
      const order = index + 1;
      bulkOps.push({
        updateOne: {
          filter: { _id: task._id },
          update: { $set: { order } },
        },
      });
      updatedIds.add(task._id.toString());
    });

    if (!isSameColumn) {
      newDestinationTasks.forEach((task, index) => {
        const order = index + 1;
        const updateData: Record<string, unknown> = { order };
        if (task._id.toString() === activeTaskIdStr) {
          updateData.columnId = destinationColumnId;
        }
        bulkOps.push({
          updateOne: {
            filter: { _id: task._id },
            update: { $set: updateData },
          },
        });
        updatedIds.add(task._id.toString());
      });
    }

    if (bulkOps.length > 0) {
      await TasksModel.bulkWrite(bulkOps);
    }

    const updatedTasks = await TasksModel.find({
      _id: { $in: [...updatedIds].map((id) => new ObjectId(id)) },
    })
      .lean<Task[]>()
      .exec();

    const channelName = `project-${payload.projectId}`;
    const eventName = "task-updated";
    await Promise.all(
      updatedTasks.map((updatedTask) =>
        pusherServer.trigger(channelName, eventName, updatedTask)
      )
    );

    return NextResponse.json(
      {
        success: true,
        message: "Move task is success",
        data: updatedTasks,
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
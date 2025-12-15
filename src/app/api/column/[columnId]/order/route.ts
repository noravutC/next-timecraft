// app/api/column/[columnId]/order/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ColumnsModel } from "@/model/column";
import { Column } from "@/types/column";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import type { AnyBulkWriteOperation } from "mongoose";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { columnId } = await params;
    const body = await request.json(); // columnData: { order: 2, name?, ... }
    const { order: newOrder } = body;
    if (newOrder === undefined) {
      return NextResponse.json(
        { success: false, message: "order is required", updated: null },
        { status: 400 }
      );
    }

    await connectDB();

    // หา column ตัวนี้
    const targetColumn = await ColumnsModel.findOne({
      _id: columnId,
      isDeleted: false,
    })
      .lean<Column>()
      .exec();
    if (!targetColumn) {
      return NextResponse.json(
        { success: false, message: "Column not found", updated: null },
        { status: 404 }
      );
    }

    const projectId = targetColumn.projectId;

    // หา columns ทั้งหมดใน project
    const columns = await ColumnsModel.find({
      projectId,
      isDeleted: false,
    })
      .lean<Column[]>()
      .exec();

    const originalOrder = targetColumn.order;

    // ถ้า order ไม่เปลี่ยน ก็ไม่ต้องทำอะไร
    if (originalOrder === newOrder) {
      const updatedColumn = await ColumnsModel.findOneAndUpdate(
        { _id: columnId, isDeleted: false },
        body,
        { new: true }
      ).lean();
      return NextResponse.json(
        { success: true, message: "Column updated", updated: updatedColumn },
        { status: 200 }
      );
    }

    // เลือก columns ที่ต้อง shift order
    const min = Math.min(originalOrder, newOrder);
    const max = Math.max(originalOrder, newOrder);
    const direction = originalOrder < newOrder ? -1 : 1;

    const bulkOps: AnyBulkWriteOperation<Column>[] = columns
      .filter(
        (c) => c._id.toString() !== columnId && c.order >= min && c.order <= max
      )
      .map((c) => ({
        updateOne: {
          filter: { _id: c._id },
          update: { $inc: { order: direction } },
        },
      }));

    // update column ตัวที่ลาก
    bulkOps.push({
      updateOne: {
        filter: { _id: columnId },
        update: { $set: { order: newOrder } }, // TS ไม่ error เพราะ bulkOps type ถูกกำหนด
      },
    });

    await ColumnsModel.bulkWrite(bulkOps);

    const updatedColumn = await ColumnsModel.find({ projectId }).lean();
    console.log("updatedColumn: ", updatedColumn);
    return NextResponse.json(
      {
        success: true,
        message: "Column order updated successfully",
        updated: updatedColumn.sort((a, b) => a.order - b.order),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating column:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update column",
        updated: null,
        error: `${error}`,
      },
      { status: 500 }
    );
  }
}

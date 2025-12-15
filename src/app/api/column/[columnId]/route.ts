// app/api/column/[columnId]/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ColumnsModel } from "@/model/column";
import { Column } from "@/types/column";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Not  authenticated",
        updated: null,
      },
      { status: 401 }
    );
  }

  try {
    const { columnId } = await params;
    const body = await request.json();
    await connectDB();

    const updatedColumn = await ColumnsModel.findOneAndUpdate(
      { _id: columnId, isDeleted: false },
      body,
      { new: true },
    ).lean<Column>();
    if (!updatedColumn) {
      return NextResponse.json(
        {
          success: false,
          message: "Column not found",
          updated: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Column updated successfully",
        updated: updatedColumn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error updating column:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update column",
        updated: null,
        error: error,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Not authenticated",
        deleted: null,
      },
      { status: 401 }
    );
  }

  try {
    const { columnId } = await params;
    await connectDB();

    const now = new Date();
    const purgeDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days

    const deletedColumn = await ColumnsModel.findOneAndUpdate(
      { _id: columnId, isDeleted: false }, // ป้องกัน soft delete ซ้ำ
      {
        $set: {
          isDeleted: true,
          deletedAt: now,
          purgeAt: purgeDate,
        },
      },
      { new: true } // ส่งค่าหลัง update
    ).lean();

    if (!deletedColumn) {
      return NextResponse.json(
        {
          success: false,
          message: "Column not found or already deleted",
          deleted: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Column soft-deleted successfully",
        deleted: deletedColumn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error soft-deleting column:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete column",
        deleted: null,
        error,
      },
      { status: 500 }
    );
  }
}


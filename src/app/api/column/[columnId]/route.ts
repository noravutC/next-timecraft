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

    const updatedColumn = await ColumnsModel.findByIdAndUpdate(columnId, body, {
      new: true,
    }).lean<Column>();
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

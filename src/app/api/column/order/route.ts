// app/api/column/order/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ColumnsModel } from "@/model/column";
import { type Column  } from "@/types/column";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ColumnSchema } from "@/model/validate/column";
import mongoose from "mongoose";

export async function POST(request: Request) {
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
    const body = await request.json();
    // const { projectId, data, order } = body;
    const projectId: string | undefined = typeof body.projectId === 'string' ? body.projectId : undefined;
    const data: Partial<Column> | undefined = body.data ?? undefined;
    const order: number | undefined = typeof body.order === 'number' ? Number(body.order) : undefined;
    await connectDB();
    if (!projectId || !data || order === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "projectId, data and order are required",
          created: null,
        },
        { status: 400 }
      );
    }
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    await ColumnsModel.updateMany(
      {
        projectId: projectObjectId,
        order: { $gte: order },
      },
      { $inc: { order: 1 } }
    );

    const newColumn = await ColumnsModel.create({
      ...data,
      projectId: projectObjectId,
      order: order,
    });
    return NextResponse.json(
      {
        success: true,
        message: "Create column success",
        created: newColumn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error create column:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create column",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}

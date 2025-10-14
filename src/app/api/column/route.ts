// app/api/column/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ColumnsModel } from "@/model/column";
import { type Column  } from "@/types/column";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ColumnSchema } from "@/model/validate/column";
import mongoose from "mongoose";

export async function GET() {
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
    await connectDB();

    const response: Column[] = await ColumnsModel.find();
    return NextResponse.json(
      {
        success: true,
        message: "Get columns success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching columns:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch columns",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}

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
    const { ...newColumn } = body;
    const parsed = ColumnSchema.parse(newColumn);
    const normalized = {
          ...parsed,
          projectId: new mongoose.Types.ObjectId(parsed.projectId),
        };
    await connectDB();
    const column = new ColumnsModel(normalized);
    await column.save();
    return NextResponse.json(
      {
        success: true,
        message: "Create column success",
        created: column,
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

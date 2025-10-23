// app/api/column/look-up/project/[projectId]/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { ColumnsModel } from "@/model/column";
import { type Column } from "@/types/column";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
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
    await connectDB();
    const response = await ColumnsModel.find({
      projectId: new ObjectId(projectId),
    }).lean<Column[]>().exec();
    return NextResponse.json(
      {
        success: true,
        message: "Get columns by project id success",
        data: response,
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

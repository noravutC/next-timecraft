// app/api/column/look-up/project/[projectId]/route.ts

import { connectDB } from "@/lib/mongodb";
import {  NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { Columns } from "@/model/column";
import { type Column  } from "@/types/column.type";

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
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
    const response: Column[] = await Columns.find({
      projectId: new ObjectId(projectId),
    });
    return NextResponse.json(
      {
        success: true,
        message: "Success to get columns by project id!",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching columns by projectId:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch columns by projectId",
        error: error,
      },
      { status: 500 }
    );
  }
}

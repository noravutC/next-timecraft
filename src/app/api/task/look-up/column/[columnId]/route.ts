// app/api/task/look-up/column/[columnId]/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { TasksModel } from "@/model/task";
import { type Task } from "@/types/task";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> }
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
    const { columnId } = await params;
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const skipParam = searchParams.get("skip");
    const archivedParam = searchParams.get("archived");
    const limit = limitParam ? Math.max(0, Number.parseInt(limitParam, 10)) : undefined;
    const skip = skipParam ? Math.max(0, Number.parseInt(skipParam, 10)) : 0;
    const archived =
      archivedParam === null ? undefined : archivedParam === "true";

    if (!columnId) {
      return NextResponse.json(
        {
          success: false,
          message: "Column ID is required for get tasks",
        },
        { status: 400 }
      );
    }
    await connectDB();
    const query: Record<string, unknown> = {
      columnId: new ObjectId(columnId),
    };
    if (archived !== undefined) {
      query.archived = archived;
    }
    let dbQuery = TasksModel.find(query).sort({ createdAt: -1 });
    if (typeof limit === "number" && limit > 0) {
      dbQuery = dbQuery.skip(skip).limit(limit);
    } else if (skip > 0) {
      dbQuery = dbQuery.skip(skip);
    }
    const response = await dbQuery.lean<Task>().exec();

    return NextResponse.json(
      {
        success: true,
        message: "Get tasks by column id success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get tasks by columnId:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get tasks by columnId",
        error: error,
      },
      { status: 500 }
    );
  }
}

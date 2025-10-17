// app/api/task/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { TasksModel } from "@/model/task";
import { SchemaTask } from "@/model/validate/task";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

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
    console.log("Request body:", body);
    const validatedData = SchemaTask.parse(body);
    const normalized = {
      ...validatedData,
      columnId: new mongoose.Types.ObjectId(validatedData.columnId),
      assignees:
        validatedData.assignees?.map((a) => new mongoose.Types.ObjectId(a)) ||
        [],
      dependencies:
        validatedData.dependencies?.map(
          (d) => new mongoose.Types.ObjectId(d)
        ) || [],
    };
    await connectDB();
    const newTask = await TasksModel.create(normalized);
    await newTask.save();
    return NextResponse.json(
      {
        success: true,
        message: "Create Project success",
        created: newTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error connect DB:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect database",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}

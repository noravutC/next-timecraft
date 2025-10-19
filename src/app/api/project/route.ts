// app/api/project/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ProjectsModel } from "@/model/project";
import { type Project } from "@/types";
import { ProjectSchema } from "@/model/validate/project";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

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

    const response = await ProjectsModel.find().lean<Project[]>().exec();
    return NextResponse.json(
      {
        success: true,
        message: "Get projects success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get projects:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get projects",
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
    if (body.members?.length > 0) {
      body.members = body.members.map((m: any) => ({
        ...m,
        joinedAt: new Date(m.joinedAt),
      }));
    }
    const parsed = ProjectSchema.parse(body);
    const normalized = {
      ...parsed,
      ownerId: new mongoose.Types.ObjectId(parsed.ownerId),
      members:
        parsed.members?.map((m) => ({
          ...m,
          userId: new mongoose.Types.ObjectId(m.userId),
        })) || [],
    };
    await connectDB();
    const project = new ProjectsModel(normalized);
    await project.save();
    return NextResponse.json(
      {
        success: true,
        message: "Create Project success",
        created: project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error create project:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create project",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}

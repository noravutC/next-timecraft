// app/api/project/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { Projects } from "@/model/project";
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

    const response: Project[] = await Projects.find();
    return NextResponse.json(
      {
        success: true,
        message: "Success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch projects",
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
    const project = new Projects(normalized);
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
    console.error("Error create project:", error);
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

// app/api/project/[Id]/route.ts

import { connectDB } from "@/lib/mongodb";
import {  NextResponse } from "next/server";
import { Projects } from "@/model/project";
import { type Project  } from "@/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
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
          message: "Project ID is required",
        },
        { status: 400 }
      );
    }
    await connectDB();
    const response: (Project | undefined | null) = await Projects.findById(projectId);
    return NextResponse.json(
      {
        success: true,
        message: "Success to get project data by ID!",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching project by ID:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch project by ID",
        error: error,
      },
      { status: 500 }
    );
  }
}

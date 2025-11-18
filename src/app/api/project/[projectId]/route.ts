// app/api/project/[Id]/route.ts

import { connectDB } from "@/lib/mongodb";
import {  NextResponse } from "next/server";
import { ProjectsModel } from "@/model/project";
import { APIPatch, type Project  } from "@/types";
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
          message: "Project ID is required",
        },
        { status: 400 }
      );
    }
    await connectDB();
    const response = await ProjectsModel.findById(projectId).lean() as Project | null;
    return NextResponse.json(
      {
        success: true,
        message: "Get project by ID success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get project by ID:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get project by ID",
        error: error,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
  // Explicitly type the response to match the client expectation (APIPatch<Project>)
): Promise<NextResponse<APIPatch<Project>>> { 
  const session = await getServerSession(authOptions);
  
  // 1. Authentication Check
  if (!session) {
    return NextResponse.json(
      {
        updated: null,
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 }
    ) as NextResponse<APIPatch<Project>>; 
  }

  try {
    const { projectId } = await params;
    
    if (!projectId) {
      return NextResponse.json(
        {
          updated: null,
          message: "Project ID is required",
          status: 400,
        },
        { status: 400 }
      ) as NextResponse<APIPatch<Project>>;
    }
    const updateData: Partial<Project> = await request.json();
  
    await connectDB();

    const updatedProject = await ProjectsModel.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true, runValidators: true } 
    ).lean().exec() as Project | null;

    if (!updatedProject) {
      return NextResponse.json(
        {
          updated: null,
          message: "Project not found or failed to update",
          status: 404,
        },
        { status: 404 }
      ) as NextResponse<APIPatch<Project>>;
    }

    return NextResponse.json(
      {
        updated: updatedProject,
        message: "Project updated successfully",
        status: 200,
      },
      { status: 200 }
    ) as NextResponse<APIPatch<Project>>;

  } catch (error) {
    console.error("Error updating project:", error);
    
    // Basic error handling for invalid data/ID format
    let status = 500;
    let message = "Failed to update project";
    
    if (error instanceof Error && error.name === 'CastError') {
        status = 400;
        message = "Invalid Project ID format provided.";
    }

    return NextResponse.json(
      {
        updated: null,
        message: message,
        status: status,
      },
      { status: status }
    ) as NextResponse<APIPatch<Project>>;
  }
}

// app/api/template-column/apply-to-project/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import mongoose from "mongoose";
import { ProjectsModel } from "@/model/project";
import { ColumnsModel } from "@/model/column";

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
    const { projectId, projectName, template } = body;
    if (!template || (!projectId && !projectName)) {
      return NextResponse.json(
        { success: false, message: "Missing projectId/projectName or template" },
        { status: 400 }
      );
    }

    await connectDB();
    let resolvedProjectId = projectId as string | undefined;
    let createdProject = null;

    if (!resolvedProjectId) {
      const ownerId = session.user?.id;
      if (!ownerId) {
        return NextResponse.json(
          { success: false, message: "Missing ownerId in session" },
          { status: 400 }
        );
      }
      const newProject = new ProjectsModel({
        name: projectName,
        ownerId: new mongoose.Types.ObjectId(ownerId),
        members: [
          {
            userId: new mongoose.Types.ObjectId(ownerId),
            role: "owner",
            joinedAt: new Date(),
          },
        ],
      });
      await newProject.save();
      createdProject = newProject;
      resolvedProjectId = newProject._id.toString();
    } else {
      const project = await ProjectsModel.findById({
        _id: new mongoose.Types.ObjectId(resolvedProjectId),
      }).lean();
      if (!project) {
        return NextResponse.json(
          { success: false, message: "Project not found" },
          { status: 404 }
        );
      }
    }

    const columnsToInsert = (template.columns ?? []).map((col: any, index: number) => ({
      _id: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(resolvedProjectId),
      name: col.name,
      color: col.color,
      wipLimit: col.wipLimit ?? 0,
      order: col.order ?? index + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const insertedColumns = await ColumnsModel.insertMany(columnsToInsert);

    if (!insertedColumns) {
        console.log("No columns were inserted.");
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Apply board template to project is success",
        projectId: resolvedProjectId,
        createdProject,
        updated: {
          projectId: resolvedProjectId,
          columns: insertedColumns
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error apply board template to project:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to apply board template to project",
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}

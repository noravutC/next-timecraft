// app/api/template-column/apply-to-project/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
// import { TemplateColumnModel } from "@/model/template-column";
// import { type TemplateColumn } from "@/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import mongoose from "mongoose";
import { ProjectsModel } from "@/model/project";
import { ColumnsModel } from "@/model/column";

export async function PUT(request: Request) {
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
    const { projectId, template } = body;
    // console.log('projectId: ', projectId);
    if (!projectId || !template) {
      return NextResponse.json(
        { success: false, message: "Missing projectId or template" },
        { status: 400 }
      );
    }

    await connectDB();
    // ✅ ตรวจว่ามี project นี้ไหมก่อน
    const project = await ProjectsModel.findById({_id: new mongoose.Types.ObjectId(projectId)}).lean();
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    // ✅ เตรียม columns ที่จะ insert
    const columnsToInsert = template.columns.map((col: any, index: number) => ({
      _id: new mongoose.Types.ObjectId(),
      projectId: new mongoose.Types.ObjectId(projectId),
      name: col.name,
      color: col.color,
      wipLimit: col.wipLimit ?? 0,
      order: col.order ?? index + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // ✅ insert ลง collection Column
    const insertedColumns = await ColumnsModel.insertMany(columnsToInsert);
    // console.log("Inserted Columns:", insertedColumns);
    // const columns = template.columns.map((col: any, index: number) => ({
    //   _id: new mongoose.Types.ObjectId(),
    //   name: col.name,
    //   color: col.color,
    //   wipLimit: col.wipLimit ?? 0,
    //   order: col.order ?? index + 1,
    //   tasks: [],
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    // }));

    // // const updatedProject = await ProjectsModel.findByIdAndUpdate(
    // //   projectId,
    // //   {
    // //     $set: {
    // //       columns,
    // //       updatedAt: new Date(),
    // //     },
    // //   },
    // //   { new: true }
    // // );

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
        updated: insertedColumns,
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

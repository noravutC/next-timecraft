// app/api/project/[Id]/route.ts

import clientPromise from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

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
          message: "Project ID is required",
        },
        { status: 400 }
      );
    }
    const client = await clientPromise;
    const db = client.db("TimeCraft");
    const response = await db
      .collection("projects")
      .find({ _id: new ObjectId(projectId) })
      .toArray();
    // console.log("Project data:", response);
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

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const {
      columnId,
      task_title,
      start_date,
      end_date,
      time_spent,
      create_by,
      assign_to,
    } = body;

    // console.log("body: ", body);
    if (!projectId || !columnId || !task_title || !create_by || !assign_to) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    const newTask: any = {
      task_id: new ObjectId(),
      task_title,
      start_date,
      end_date,
      time_spent: time_spent || [],
      create_by,
      assign_to,
    };

    const client = await clientPromise;
    const db = client.db("TimeCraft");

    const result = await db.collection("projects").updateOne(
      {
        _id: new ObjectId(projectId),
        "columns.column_id": new ObjectId(columnId),
      },
      {
        $push: {
          "columns.$.tasks": newTask,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Column not found or task not added" },
        { status: 404 }
      );
    }

    const project = await db.collection("projects").findOne(
      { _id: new ObjectId(projectId) },
      {
        projection: {
          columns: {
            $elemMatch: { column_id: new ObjectId(columnId) },
          },
        },
      }
    );

    const updatedColumn = project?.columns?.[0];
    return NextResponse.json(
      { success: true, message: "Task added successfully", updated: updatedColumn },
      { status: 200 }
    );
  } catch (err) {
    console.log("Error updating project with new task:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

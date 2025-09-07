
// app/api/organization/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { Organization } from "@/model/group-user/organization";
import { type Organizations} from "@/types";
import { ProjectSchema } from "@/model/validate/project";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    const response: Organizations[] = await Organization.find();
    return NextResponse.json(
      {
        success: true,
        message: "Success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch organizations",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const organizationData = new Organization(normalized);
    await organizationData.save();
    return NextResponse.json(
      {
        success: true,
        message: "Create Project success",
        created: organizationData as Organizations,
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

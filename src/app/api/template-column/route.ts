// app/api/template-column/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { TemplateColumnModel } from "@/model/template-column";
import { type TemplateColumn } from "@/types";
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

    const response = await TemplateColumnModel.find().lean<TemplateColumn[]>().exec();
    return NextResponse.json(
      {
        success: true,
        message: "Get template columns success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error get template columns:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get template columns",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}
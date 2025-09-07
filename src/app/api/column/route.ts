// app/api/column/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { Columns } from "@/model/column";
import { type Column  } from "@/types/column.type";

export async function GET() {
  try {
    await connectDB();

    const response: Column[] = await Columns.find();
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

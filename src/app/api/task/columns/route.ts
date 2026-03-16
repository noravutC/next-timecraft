import { authOptions } from "@/auth";
import { db } from "@/db";
import { columnsTable, projectMembersTable, tasksTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { UpdateColumnPayload } from "@/types";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

type GetTasksRequestBody = {
  colIds: string[];
  limit: number;
};

// type UpdateColumnBody = Array<UpdateColumnPayload>;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const { id: userId, organizationId } = session?.user || {};
  if (!userId?.trim() || !organizationId?.trim()) {
    return NextResponse.json(
      {
        success: false,
        message: "Not  authenticated",
        data: [],
      },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as GetTasksRequestBody;
    const colIds = body.colIds;
    if (!Array.isArray(colIds) || colIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "colIds must be a non-empty array",
          data: [],
        },
        { status: 400 },
      );
    }
    const limit = body.limit;
    if (typeof limit !== "number" || limit <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "limit must be a positive number",
          data: [],
        },
        { status: 400 },
      );
    }

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(inArray(tasksTable.columnId, colIds))
      .orderBy(asc(tasksTable.orderFraction))
      .limit(limit);

    return NextResponse.json(
      {
        data: tasks,
        message: "Get tasks success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("Error get tasks from body:", error);
    return NextResponse.json(
      {
        message: "Failed to get tasks",
        status: 500,
        data: [],
        error: error,
      },
      { status: 500 },
    );
  }
}

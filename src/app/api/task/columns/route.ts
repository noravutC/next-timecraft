import { authOptions } from "@/auth";
import { db } from "@/db";
import { columnsTable, tasksTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { and, asc, eq, inArray } from "drizzle-orm";
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

    const columnLinks = await db
      .select({ projectId: columnsTable.projectId })
      .from(columnsTable)
      .where(inArray(columnsTable.id, colIds));
    if (columnLinks.length === 0) {
      return NextResponse.json(
        { success: false, message: "Columns not found", data: [] },
        { status: 404 },
      );
    }
    const uniqProjectIds = [...new Set(columnLinks.map((c) => c.projectId))];
    const permitted = await hasPermission(
      userId,
      uniqProjectIds,
      "project:view",
    );
    if (!permitted) {
      return NextResponse.json(
        { success: false, message: "Forbidden", data: [] },
        { status: 403 },
      );
    }

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(and(inArray(tasksTable.columnId, colIds), eq(tasksTable.archived, false)))
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

import { authOptions } from "@/auth";
import { db } from "@/db";
import { columnsTable, projectMembersTable, tasksTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { UpdateColumnPayload } from "@/types";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

type RouteParams = {
  anyIds: string;
};

type UpdateColumnBody = Array<UpdateColumnPayload>;

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        data: [],
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 },
    );
  }

  const { anyIds } = await params;
  const projectIds = anyIds
    .trim()
    .split(",")
    .filter((id) => id);
  if (projectIds.length === 0) {
    return NextResponse.json(
      {
        data: [],
        message: "projectId is required",
        status: 400,
      },
      { status: 400 },
    );
  }

  const permission = await hasPermission(
    sessionUserId,
    projectIds,
    "project:view",
  );
  if (!permission) {
    return NextResponse.json(
      {
        created: null,
        message: "Forbidden",
        status: 403,
      },
      { status: 403 },
    );
  }

  // Keep compatibility with existing client query string (`?limit=...`).
  // This route returns all columns; limit is currently unused.
  void new URL(request.url).searchParams.get("limit");

  try {
    const columns = await db
      .select()
      .from(columnsTable)
      .innerJoin(
        projectMembersTable,
        eq(projectMembersTable.projectId, columnsTable.projectId),
      )
      .where(
        and(
          inArray(columnsTable.projectId, projectIds),
          eq(projectMembersTable.userId, sessionUserId),
          eq(columnsTable.isDeleted, false),
        ),
      )
      .orderBy(asc(columnsTable.projectId), asc(columnsTable.orderFraction));

    return NextResponse.json(
      {
        data: columns,
        message: "Get columns success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch columns:", error);
    return NextResponse.json(
      {
        data: [],
        message: "Failed to fetch columns",
        status: 500,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        updated: null,
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 },
    );
  }

  const { anyIds } = await params;
  const columnIds = anyIds
    .trim()
    .split(",")
    .filter((id) => id);
  if (columnIds.length === 0) {
    return NextResponse.json(
      {
        updated: null,
        message: "columnIds are required",
        status: 400,
      },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as UpdateColumnBody;
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        {
          updated: null,
          message: "Payload must be a non-empty array",
          status: 400,
        },
        { status: 400 },
      );
    }

    const existingColumnsList = await db
      .select({
        columnId: columnsTable.id,
        projectId: columnsTable.projectId,
      })
      .from(columnsTable)
      .where(inArray(columnsTable.id, columnIds));

    const uniqProjectIds = [
      ...new Set(existingColumnsList.map((col) => col.projectId)),
    ];
    const permission = await hasPermission(
      sessionUserId,
      uniqProjectIds,
      "column:update",
    );
    if (!permission) {
      return NextResponse.json(
        {
          created: null,
          message: "Forbidden",
          status: 403,
        },
        { status: 403 },
      );
    }

    const updatedColumns = await db.transaction(async (tx) => {
      const rowsUpdated = [];

      for (const item of body) {
        if (item.id && item.orderFraction) {
          const [updated] = await tx
            .update(columnsTable)
            .set({
              name: item.name,
              color: item.color,
              wipLimit: item.wipLimit,
              orderFraction: item.orderFraction,
              updatedAt: new Date(),
            })
            .where(eq(columnsTable.id, item.id))
            .returning();

          if (updated) {
            rowsUpdated.push(updated);
          }
        } else {
          console.log(
            "Lacking column id or order fraction when update bulk column at: ",
            item.name,
          );
        }
      }

      return rowsUpdated;
    });

    return NextResponse.json(
      {
        updated: updatedColumns,
        message: "Update columns success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message ===
        "orderFraction must be a valid fractional key string or integer index" ||
        error.message === "No fractional key space available" ||
        error.message === "Too many columns for fractional indexing")
    ) {
      return NextResponse.json(
        {
          updated: null,
          message: error.message,
          status: 400,
        },
        { status: 400 },
      );
    }

    console.error("Failed to update columns:", error);
    return NextResponse.json(
      {
        updated: null,
        message: "Failed to update columns",
        status: 500,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        deleted: false,
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 },
    );
  }

  const { anyIds } = await params;
  const columnIds = anyIds
    .trim()
    .split(",")
    .filter((id) => id);
  if (columnIds.length === 0) {
    return NextResponse.json(
      {
        deleted: false,
        message: "columnIds are required",
        status: 400,
      },
      { status: 400 },
    );
  }

  try {
    const existingColumnsList = await db
      .select({
        columnId: columnsTable.id,
        projectId: columnsTable.projectId,
      })
      .from(columnsTable)
      .where(inArray(columnsTable.id, columnIds));

    const uniqProjectIds = [
      ...new Set(existingColumnsList.map((col) => col.projectId)),
    ];
    const permission = await hasPermission(
      sessionUserId,
      uniqProjectIds,
      "column:update",
    );
    if (!permission) {
      return NextResponse.json(
        {
          created: null,
          message: "Forbidden",
          status: 403,
        },
        { status: 403 },
      );
    }

    const deletedRows = await db
      .update(columnsTable)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        purgeAt: sql`now() + interval '30 days'`,
      })
      .where(inArray(columnsTable.id, columnIds))
      .returning({ id: columnsTable.id });

    return NextResponse.json(
      {
        deleted: deletedRows.length === columnIds.length,
        message: "Delete columns success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to delete columns:", error);
    return NextResponse.json(
      {
        deleted: false,
        message: "Failed to delete columns",
        status: 500,
      },
      { status: 500 },
    );
  }
}

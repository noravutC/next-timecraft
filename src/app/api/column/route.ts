import { authOptions } from "@/auth";
import { db } from "@/db";
import { columnsTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import {
  assignBulkIndexes,
  isValidFractionKey,
} from "@/helper/utils/fraction-string-indexing";
import { CreateColumnPayload, NewColumnRow } from "@/types";
import { and, eq, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

type CreateColumnBody = Array<CreateColumnPayload>;

const normalizeCreateInput = (
  item: CreateColumnBody[number],
): CreateColumnPayload => {
  const projectId = item.projectId?.trim() ?? "";
  const name = item.name?.trim() ?? "";

  if (!projectId || !name) {
    throw new Error("projectId and name are required");
  }

  return {
    projectId,
    name,
    color: item.color?.trim() || "#CBD5E1",
    wipLimit: Number.isFinite(item.wipLimit) ? Number(item.wipLimit) : 0,
  };
};

const groupByProjectId = <T extends { projectId: string }>(items: T[]) => {
  const grouped = new Map<string, T[]>();
  items.forEach((item) => {
    const bucket = grouped.get(item.projectId) ?? [];
    bucket.push(item);
    grouped.set(item.projectId, bucket);
  });
  return grouped;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        created: null,
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as CreateColumnBody;
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        {
          created: null,
          message: "Payload must be a non-empty array",
          status: 400,
        },
        { status: 400 },
      );
    }

    const normalizedBody = body.map(normalizeCreateInput);
    const projectIds = [
      ...new Set(normalizedBody.map((item) => item.projectId)),
    ];
    if (projectIds.length === 0) {
      return NextResponse.json(
        {
          created: null,
          message: "projectId is required",
          status: 400,
        },
        { status: 400 },
      );
    }

    const permission = await hasPermission(
      sessionUserId,
      projectIds,
      "column:create",
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

    const existingColumns = await db
      .select({
        projectId: columnsTable.projectId,
        orderFraction: columnsTable.orderFraction,
      })
      .from(columnsTable)
      .where(
        and(
          inArray(columnsTable.projectId, projectIds),
          eq(columnsTable.isDeleted, false),
        ),
      );

    const lastOrderByProject = new Map<string, string>();
    existingColumns.forEach((column) => {
      if (!isValidFractionKey(column.orderFraction)) {
        return;
      }
      const current = lastOrderByProject.get(column.projectId);
      if (!current || current.localeCompare(column.orderFraction) < 0) {
        lastOrderByProject.set(column.projectId, column.orderFraction);
      }
    });

    const groupedByProject = groupByProjectId(normalizedBody);
    const rowsToInsert: NewColumnRow[] = [];

    groupedByProject.forEach((items, projectId) => {
      const prevOrder = lastOrderByProject.get(projectId) ?? null;
      const rowsWithIndexes = assignBulkIndexes(
        items.map((item) => ({ ...item, orderFraction: undefined })),
        prevOrder,
        null,
      );

      rowsWithIndexes.forEach((item) => {
        rowsToInsert.push({
          projectId: item.projectId,
          name: item.name,
          color: item.color,
          wipLimit: item.wipLimit,
          orderFraction: item.orderFraction ?? "",
        });
      });
    });

    const createdColumns = await db
      .insert(columnsTable)
      .values(rowsToInsert)
      .returning();

    return NextResponse.json(
      {
        created: createdColumns.map((column) => ({
          ...column,
          timestamp: Date.now(),
        })),
        message: "Create columns success",
        status: 201,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "projectId and name are required"
        ? error.message
        : "Failed to create columns";
    const statusCode =
      message === "projectId and name are required" ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to create columns:", error);
    }

    return NextResponse.json(
      {
        created: null,
        message,
        status: statusCode,
      },
      { status: statusCode },
    );
  }
}

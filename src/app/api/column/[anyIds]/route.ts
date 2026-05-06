import { db } from "@/db";
import { columnsTable } from "@/db/schema";
import { BadRequestError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

type RouteParams = { anyIds: string };

const parseIds = (anyIds: string): string[] =>
  anyIds
    .trim()
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id);

export const GET = createParamHandle<RouteParams>(
  {
    permission: "project:view",
    resolveProjectIds: ({ params }) => parseIds(params.anyIds),
  },
  async ({ params }) => {
    const projectIds = parseIds(params.anyIds);
    if (projectIds.length === 0) {
      throw new BadRequestError("projectId is required");
    }

    const columns = await db
      .select()
      .from(columnsTable)
      .where(
        and(
          inArray(columnsTable.projectId, projectIds),
          eq(columnsTable.isDeleted, false),
        ),
      )
      .orderBy(asc(columnsTable.orderFraction));

    return NextResponse.json(
      { data: columns, message: "Get columns success", status: 200 },
      { status: 200 },
    );
  },
);

const updateColumnSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      name: z.string().optional(),
      color: z.string().optional(),
      wipLimit: z.number().optional(),
      orderFraction: z.string().optional(),
    }),
  )
  .min(1, "Payload must be a non-empty array");

type UpdateColumnBody = z.infer<typeof updateColumnSchema>;

export const PATCH = createParamHandle<RouteParams, UpdateColumnBody>(
  { body: updateColumnSchema },
  async ({ params, body, userId }) => {
    const columnIds = parseIds(params.anyIds);
    if (columnIds.length === 0) {
      throw new BadRequestError("columnIds are required");
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
    await authorizeOrThrow(userId, uniqProjectIds, "column:update");

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

          if (updated) rowsUpdated.push(updated);
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
      { updated: updatedColumns, message: "Update columns success", status: 200 },
      { status: 200 },
    );
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const columnIds = parseIds(params.anyIds);
    if (columnIds.length === 0) {
      throw new BadRequestError("columnIds are required");
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
    await authorizeOrThrow(userId, uniqProjectIds, "column:update");

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
  },
);

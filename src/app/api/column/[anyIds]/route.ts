import { db } from "@/db";
import { columnsTable } from "@/db/schema";
import { getActiveColumnLinks } from "@/db/uniq-query/column/column-utils";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { parseIdList } from "@/lib/api/params";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import {
  broadcastColumns,
  broadcastColumnsDeleted,
} from "@/lib/realtime/board-events";
import {
  updateColumnSchema,
  type UpdateColumnBody,
} from "@/validations/column.validation";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

type RouteParams = { anyIds: string };

export const GET = createParamHandle<RouteParams>(
  {
    permission: "project:view",
    resolveProjectIds: ({ params }) => parseIdList(params.anyIds),
  },
  async ({ params }) => {
    const projectIds = parseIdList(params.anyIds);

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

export const PATCH = createParamHandle<RouteParams, UpdateColumnBody>(
  { body: updateColumnSchema },
  async ({ request, params, body, userId }) => {
    const columnIds = parseIdList(params.anyIds);

    // Authorization covers the URL ids, so the body may only touch those.
    const allowedIds = new Set(columnIds);
    if (body.some((item) => !allowedIds.has(item.id))) {
      throw new BadRequestError("Payload ids must match the ids in the URL");
    }

    const existingColumnsList = await getActiveColumnLinks(columnIds);
    if (existingColumnsList.length !== columnIds.length) {
      throw new NotFoundError("Some columns not found");
    }

    const uniqProjectIds = [
      ...new Set(existingColumnsList.map((col) => col.projectId)),
    ];
    await authorizeOrThrow(userId, uniqProjectIds, "column:update");

    const projectByColumn = new Map(
      existingColumnsList.map((col) => [col.columnId, col.projectId]),
    );

    const updatedColumns = await db.transaction(async (tx) => {
      const rowsUpdated = [];

      // only the fields sent change: a rename doesn't need the order, a
      // move doesn't need the name
      for (const item of body) {
        const projectId = projectByColumn.get(item.id);
        // a board has one Done column: the previous one hands the flag over
        if (item.isDone && projectId) {
          const cleared = await tx
            .update(columnsTable)
            .set({ isDone: false, updatedAt: new Date() })
            .where(
              and(
                eq(columnsTable.projectId, projectId),
                eq(columnsTable.isDone, true),
                eq(columnsTable.isDeleted, false),
                ne(columnsTable.id, item.id),
              ),
            )
            .returning();
          rowsUpdated.push(...cleared);
        }

        const [updated] = await tx
          .update(columnsTable)
          .set({
            name: item.name,
            color: item.color,
            wipLimit: item.wipLimit,
            orderFraction: item.orderFraction,
            isDone: item.isDone,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(columnsTable.id, item.id),
              eq(columnsTable.isDeleted, false),
            ),
          )
          .returning();

        if (updated) rowsUpdated.push(updated);
      }

      return rowsUpdated;
    });

    broadcastColumns(request, updatedColumns);

    return NextResponse.json(
      { updated: updatedColumns, message: "Update columns success", status: 200 },
      { status: 200 },
    );
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const columnIds = parseIdList(params.anyIds);

    const existingColumnsList = await getActiveColumnLinks(columnIds);
    if (existingColumnsList.length === 0) {
      throw new NotFoundError("Columns not found");
    }

    const uniqProjectIds = [
      ...new Set(existingColumnsList.map((col) => col.projectId)),
    ];
    await authorizeOrThrow(userId, uniqProjectIds, "column:delete");

    // Only active columns: re-deleting must not push purgeAt further out.
    const deletedRows = await db
      .update(columnsTable)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        purgeAt: sql`now() + interval '30 days'`,
      })
      .where(
        inArray(
          columnsTable.id,
          existingColumnsList.map((col) => col.columnId),
        ),
      )
      .returning({ id: columnsTable.id });

    const deletedIds = new Set(deletedRows.map((r) => r.id));
    broadcastColumnsDeleted(
      request,
      existingColumnsList.filter((col) => deletedIds.has(col.columnId)),
    );

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

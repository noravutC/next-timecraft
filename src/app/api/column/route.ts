import { db } from "@/db";
import { columnsTable } from "@/db/schema";
import { createHandle } from "@/lib/api/handle";
import {
  assignBulkIndexes,
  isValidFractionKey,
} from "@/helper/utils/fraction-string-indexing";
import { NewColumnRow } from "@/types";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const createColumnSchema = z
  .array(
    z.object({
      projectId: z.string().trim().min(1),
      name: z.string().trim().min(1),
      color: z.string().trim().optional(),
      wipLimit: z.number().optional(),
    }),
  )
  .min(1, "Payload must be a non-empty array");

type CreateColumnBody = z.infer<typeof createColumnSchema>;

const groupByProjectId = <T extends { projectId: string }>(items: T[]) => {
  const grouped = new Map<string, T[]>();
  items.forEach((item) => {
    const bucket = grouped.get(item.projectId) ?? [];
    bucket.push(item);
    grouped.set(item.projectId, bucket);
  });
  return grouped;
};

export const POST = createHandle<CreateColumnBody>(
  {
    body: createColumnSchema,
    permission: "column:create",
    resolveProjectIds: ({ body }) => [
      ...new Set(body.map((item) => item.projectId)),
    ],
  },
  async ({ body }) => {
    const normalized = body.map((item) => ({
      projectId: item.projectId,
      name: item.name,
      color: item.color?.trim() || "#CBD5E1",
      wipLimit: Number.isFinite(item.wipLimit) ? Number(item.wipLimit) : 0,
    }));

    const projectIds = [...new Set(normalized.map((item) => item.projectId))];

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
      if (!isValidFractionKey(column.orderFraction)) return;
      const current = lastOrderByProject.get(column.projectId);
      if (!current || current.localeCompare(column.orderFraction) < 0) {
        lastOrderByProject.set(column.projectId, column.orderFraction);
      }
    });

    const groupedByProject = groupByProjectId(normalized);
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
  },
);

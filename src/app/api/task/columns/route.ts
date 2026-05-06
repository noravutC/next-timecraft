import { db } from "@/db";
import { columnsTable, tasksTable } from "@/db/schema";
import { NotFoundError } from "@/lib/api/errors";
import { createHandle } from "@/lib/api/handle";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { and, asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const getTasksByColumnsSchema = z.object({
  colIds: z.array(z.string().min(1)).min(1, "colIds must be a non-empty array"),
  limit: z.number().int().positive(),
});

type GetTasksByColumnsBody = z.infer<typeof getTasksByColumnsSchema>;

export const POST = createHandle<GetTasksByColumnsBody>(
  { body: getTasksByColumnsSchema },
  async ({ body, userId }) => {
    const { colIds, limit } = body;

    const columnLinks = await db
      .select({ projectId: columnsTable.projectId })
      .from(columnsTable)
      .where(inArray(columnsTable.id, colIds));
    if (columnLinks.length === 0) {
      throw new NotFoundError("Columns not found");
    }

    const uniqProjectIds = [...new Set(columnLinks.map((c) => c.projectId))];
    await authorizeOrThrow(userId, uniqProjectIds, "project:view");

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(
        and(
          inArray(tasksTable.columnId, colIds),
          eq(tasksTable.archived, false),
        ),
      )
      .orderBy(asc(tasksTable.orderFraction))
      .limit(limit);

    return NextResponse.json(
      { data: tasks, message: "Get tasks success", status: 200 },
      { status: 200 },
    );
  },
);

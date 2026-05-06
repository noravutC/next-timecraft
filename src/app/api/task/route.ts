import { db } from "@/db";
import { columnsTable, tasksTable } from "@/db/schema";
import { createHandle } from "@/lib/api/handle";
import { NotFoundError } from "@/lib/api/errors";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { NewTaskRow } from "@/types";
import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const createTaskSchema = z
  .array(
    z.object({
      columnId: z.string().trim().min(1),
      title: z.string().trim().min(1),
      description: z.string().trim().nullable().optional(),
      orderFraction: z.string().trim().optional(),
      tags: z.array(z.string()).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.string().nullable().optional(),
    }),
  )
  .min(1, "Payload must be a non-empty array");

type CreateTaskBody = z.infer<typeof createTaskSchema>;

export const POST = createHandle<CreateTaskBody>(
  { body: createTaskSchema },
  async ({ userId, body }) => {
    const columnIds = [...new Set(body.map((item) => item.columnId))];

    const columnLinks = await db
      .select({ columnId: columnsTable.id, projectId: columnsTable.projectId })
      .from(columnsTable)
      .where(inArray(columnsTable.id, columnIds));

    if (columnLinks.length !== columnIds.length) {
      throw new NotFoundError("Some columns not found");
    }

    const projectIds = [...new Set(columnLinks.map((c) => c.projectId))];
    await authorizeOrThrow(userId, projectIds, "task:create");

    const rowsToInsert: NewTaskRow[] = body.map((item) => ({
      columnId: item.columnId,
      title: item.title,
      description: item.description ?? null,
      orderFraction: item.orderFraction?.trim() || "a0",
      tags: item.tags ?? [],
      priority: item.priority ?? "medium",
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
      updatedAt: new Date(),
    }));

    const createdTasks = await db
      .insert(tasksTable)
      .values(rowsToInsert)
      .returning();

    return NextResponse.json(
      {
        created: createdTasks.map((task) => ({ ...task, timestamp: Date.now() })),
        message: "Create tasks success",
        status: 201,
      },
      { status: 201 },
    );
  },
);

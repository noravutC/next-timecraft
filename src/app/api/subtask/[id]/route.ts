import { db } from "@/db";
import { subtasksTable } from "@/db/schema";
import { getSubtaskTaskLink } from "@/db/uniq-query/task/subtask-utils";
import { NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { triggerExclusive } from "@/lib/pusher-server";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_TITLE_LEN = 500;

type RouteParams = { id: string };

const updateSubtaskSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_TITLE_LEN).optional(),
    completed: z.boolean().optional(),
    orderFraction: z.string().trim().min(1).optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.completed !== undefined ||
      v.orderFraction !== undefined,
    "At least one field is required",
  );

type UpdateSubtaskBody = z.infer<typeof updateSubtaskSchema>;

export const PATCH = createParamHandle<RouteParams, UpdateSubtaskBody>(
  { body: updateSubtaskSchema },
  async ({ request, params, body, userId }) => {
    const link = await getSubtaskTaskLink(params.id);
    if (!link) throw new NotFoundError("Subtask not found");

    await authorizeOrThrow(userId, [link.projectId], "task:update");

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) patch.title = body.title;
    if (body.completed !== undefined) {
      patch.completed = body.completed;
      patch.completedAt = body.completed ? new Date() : null;
    }
    if (body.orderFraction !== undefined) patch.orderFraction = body.orderFraction;

    const [updated] = await db
      .update(subtasksTable)
      .set(patch)
      .where(eq(subtasksTable.id, params.id))
      .returning();

    triggerExclusive(
      request,
      `task-${link.taskId}`,
      "subtask-updated",
      updated,
    ).catch((e) => console.error("Pusher subtask-updated failed:", e));

    return NextResponse.json(
      { updated, message: "Update subtask success", status: 200 },
      { status: 200 },
    );
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const link = await getSubtaskTaskLink(params.id);
    if (!link) throw new NotFoundError("Subtask not found");

    await authorizeOrThrow(userId, [link.projectId], "task:update");

    await db.delete(subtasksTable).where(eq(subtasksTable.id, params.id));

    triggerExclusive(request, `task-${link.taskId}`, "subtask-deleted", {
      id: params.id,
    }).catch((e) => console.error("Pusher subtask-deleted failed:", e));

    return NextResponse.json(
      { deleted: true, message: "Delete subtask success", status: 200 },
      { status: 200 },
    );
  },
);

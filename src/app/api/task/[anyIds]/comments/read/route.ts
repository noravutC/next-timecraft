import { db } from "@/db";
import { commentReadStateTable } from "@/db/schema";
import { getTaskProjectLink } from "@/db/uniq-query/comment/comment-utils";
import { NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

type RouteParams = { anyIds: string };

const markReadSchema = z.object({
  lastReadCommentId: z.string().nullable().optional(),
});

type MarkReadBody = z.infer<typeof markReadSchema>;

export const POST = createParamHandle<RouteParams, MarkReadBody>(
  { body: markReadSchema },
  async ({ params, body, userId }) => {
    const taskId = params.anyIds;
    const lastReadCommentId = body.lastReadCommentId ?? null;

    const link = await getTaskProjectLink(taskId);
    if (!link) throw new NotFoundError("Task not found");

    await authorizeOrThrow(userId, [link.projectId], "project:view");

    await db
      .insert(commentReadStateTable)
      .values({
        userId,
        taskId,
        lastReadCommentId,
        lastReadAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [commentReadStateTable.userId, commentReadStateTable.taskId],
        set: {
          lastReadCommentId,
          lastReadAt: sql`now()`,
        },
      });

    return NextResponse.json(
      { created: { ok: true }, message: "Marked read", status: 200 },
      { status: 200 },
    );
  },
);

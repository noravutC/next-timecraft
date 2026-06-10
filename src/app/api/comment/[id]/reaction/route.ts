import { db } from "@/db";
import { taskCommentReactionsTable } from "@/db/schema";
import {
  fetchReactionsForComments,
  getCommentLink,
} from "@/db/uniq-query/comment/comment-utils";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { triggerExclusive } from "@/lib/pusher-server";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const ALLOWED_EMOJIS = new Set(["👍", "❤️", "😂", "😮", "😢", "🎉"]);

const schema = z.object({
  emoji: z.string().min(1).max(16),
});

type Body = z.infer<typeof schema>;
type RouteParams = { id: string };

export const POST = createParamHandle<RouteParams, Body>(
  { body: schema },
  async ({ request, params, body, userId }) => {
    const commentId = params.id;
    const emoji = body.emoji;

    if (!ALLOWED_EMOJIS.has(emoji)) {
      throw new BadRequestError("Unsupported reaction emoji");
    }

    const link = await getCommentLink(commentId);
    if (!link) throw new NotFoundError("Comment not found");

    await authorizeOrThrow(userId, [link.projectId], "comment:react");

    const existing = await db
      .select()
      .from(taskCommentReactionsTable)
      .where(
        and(
          eq(taskCommentReactionsTable.commentId, commentId),
          eq(taskCommentReactionsTable.userId, userId),
          eq(taskCommentReactionsTable.emoji, emoji),
        ),
      )
      .limit(1);

    let action: "added" | "removed";
    if (existing.length > 0) {
      await db
        .delete(taskCommentReactionsTable)
        .where(
          and(
            eq(taskCommentReactionsTable.commentId, commentId),
            eq(taskCommentReactionsTable.userId, userId),
            eq(taskCommentReactionsTable.emoji, emoji),
          ),
        );
      action = "removed";
    } else {
      await db.insert(taskCommentReactionsTable).values({
        commentId,
        userId,
        emoji,
      });
      action = "added";
    }

    const reactionsByComment = await fetchReactionsForComments([commentId]);
    const reactions = reactionsByComment[commentId] ?? [];

    triggerExclusive(
      request,
      `task-${link.taskId}`,
      "comment-reaction-changed",
      { commentId, reactions },
    ).catch((e) => console.error("Pusher reaction failed:", e));

    return NextResponse.json(
      {
        data: { commentId, reactions, action, emoji },
        message: "Reaction toggled",
        status: 200,
      },
      { status: 200 },
    );
  },
);

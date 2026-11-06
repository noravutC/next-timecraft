import { getTaskProjectLink } from "@/db/uniq-query/comment/comment-utils";
import { AppError, BadRequestError, NotFoundError } from "@/lib/api/errors";
import { createHandle } from "@/lib/api/handle";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import {
  buildCommentMediaPath,
  classifyMime,
  COMMENT_MEDIA_BUCKET,
  maxBytesFor,
  supabaseAdmin,
} from "@/lib/supabase-storage";
import { NextResponse } from "next/server";
import {
  commentUploadUrlSchema,
  type CommentUploadUrlBody,
} from "@/validations/comment.validation";

export const POST = createHandle<CommentUploadUrlBody>(
  { body: commentUploadUrlSchema },
  async ({ body, userId }) => {
    if (!supabaseAdmin) {
      throw new AppError(500, "Storage is not configured");
    }

    const kind = classifyMime(body.mimeType);
    if (!kind) throw new BadRequestError("Unsupported file type");
    if (body.sizeBytes > maxBytesFor(kind)) {
      throw new BadRequestError(
        `File too large (max ${Math.round(maxBytesFor(kind) / 1024 / 1024)}MB for ${kind})`,
      );
    }

    const link = await getTaskProjectLink(body.taskId);
    if (!link) throw new NotFoundError("Task not found");

    await authorizeOrThrow(userId, [link.projectId], "comment:upload");

    const path = buildCommentMediaPath(link.projectId, body.taskId, body.fileName);

    const { data, error } = await supabaseAdmin.storage
      .from(COMMENT_MEDIA_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data) {
      console.error("[upload-url]", error);
      throw new AppError(500, "Failed to create upload URL");
    }

    const { data: pub } = supabaseAdmin.storage
      .from(COMMENT_MEDIA_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json(
      {
        data: {
          uploadUrl: data.signedUrl,
          token: data.token,
          path,
          publicUrl: pub.publicUrl,
          kind,
        },
        message: "Signed upload URL created",
        status: 200,
      },
      { status: 200 },
    );
  },
);

import { getTaskProjectLink } from "@/db/uniq-query/comment/comment-utils";
import { AppError, BadRequestError, NotFoundError } from "@/lib/api/errors";
import { createHandle } from "@/lib/api/handle";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import {
  classifyMime,
  COMMENT_MEDIA_BUCKET,
  maxBytesFor,
  supabaseAdmin,
} from "@/lib/supabase-storage";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  taskId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
});

type Body = z.infer<typeof schema>;

const sanitizeFileName = (name: string): string =>
  name
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);

export const POST = createHandle<Body>(
  { body: schema },
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

    const safeName = sanitizeFileName(body.fileName);
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${link.projectId}/${body.taskId}/${id}-${safeName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(COMMENT_MEDIA_BUCKET)
      .createSignedUploadUrl(path);

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

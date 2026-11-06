import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn(
    "[supabase-storage] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — uploads will fail",
  );
}

export const COMMENT_MEDIA_BUCKET = "task-comment-media";

export const supabaseAdmin =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_FILES_PER_COMMENT = 10;

export const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export type AttachmentKind = "image" | "video";

export const classifyMime = (mime: string): AttachmentKind | null => {
  if (ALLOWED_IMAGE_MIME.has(mime)) return "image";
  if (ALLOWED_VIDEO_MIME.has(mime)) return "video";
  return null;
};

export const maxBytesFor = (kind: AttachmentKind): number =>
  kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

const sanitizeFileName = (name: string): string =>
  name
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);

// <projectId>/<taskId>/<uuid>-<safe file name>
export const buildCommentMediaPath = (
  projectId: string,
  taskId: string,
  fileName: string,
): string =>
  `${projectId}/${taskId}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;

const UUID_SEGMENT = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const MEDIA_FILE_PATTERN = new RegExp(`^${UUID_SEGMENT}-[\\w.\\-]{1,80}$`, "i");

/** Exactly the shape buildCommentMediaPath() produces for this task, so no `..` or other folders. */
export const isCommentMediaPath = (
  path: string,
  projectId: string,
  taskId: string,
): boolean => {
  const prefix = `${projectId}/${taskId}/`;
  return (
    path.startsWith(prefix) && MEDIA_FILE_PATTERN.test(path.slice(prefix.length))
  );
};

/**
 * Size/type sent with the signed-URL request are only what the client claims.
 * Check what was actually stored; delete it if it breaks the rules.
 */
export async function verifyUploadedObject(
  path: string,
  kind: AttachmentKind,
): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const bucket = supabaseAdmin.storage.from(COMMENT_MEDIA_BUCKET);
  const { data, error } = await bucket.info(path);
  if (error || !data) return false;
  const ok =
    typeof data.size === "number" &&
    data.size <= maxBytesFor(kind) &&
    classifyMime(data.contentType ?? "") === kind;
  if (!ok) await bucket.remove([path]);
  return ok;
}

const REMOVE_BATCH = 100;

// ลบไฟล์ใน bucket แบบ best-effort — ไม่ throw เพราะเรียกหลังลบ DB row ไปแล้ว
// (ลบไฟล์พลาด = ไฟล์กำพร้าเท่าเดิม แต่ห้ามทำให้ request หลักล้ม)
export async function removeStorageObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  if (!supabaseAdmin) {
    console.warn(
      `[supabase-storage] client missing — skipped removing ${paths.length} objects`,
    );
    return;
  }
  for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
    const batch = paths.slice(i, i + REMOVE_BATCH);
    const { error } = await supabaseAdmin.storage
      .from(COMMENT_MEDIA_BUCKET)
      .remove(batch);
    if (error) {
      console.error("[supabase-storage] failed to remove objects:", error.message);
    }
  }
}

import { commentServices } from "@/services/comment.service";
import type { AttachmentInput } from "@/types";

const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const ALLOWED_VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_FILES_PER_COMMENT = 10;

export const classifyFile = (
  file: File,
): { kind: "image" | "video"; ok: true } | { ok: false; reason: string } => {
  if (ALLOWED_IMAGE_MIME.has(file.type)) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, reason: "Image exceeds 10MB" };
    }
    return { kind: "image", ok: true };
  }
  if (ALLOWED_VIDEO_MIME.has(file.type)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return { ok: false, reason: "Video exceeds 50MB" };
    }
    return { kind: "video", ok: true };
  }
  return { ok: false, reason: `Unsupported type: ${file.type || "unknown"}` };
};

const probeImageDimensions = (
  file: File,
): Promise<{ width: number; height: number } | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      URL.revokeObjectURL(url);
      resolve(w && h ? { width: w, height: h } : null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });

const probeVideoMetadata = (
  file: File,
): Promise<{ width: number; height: number; durationMs: number } | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const w = v.videoWidth;
      const h = v.videoHeight;
      const d = Math.round((v.duration || 0) * 1000);
      URL.revokeObjectURL(url);
      resolve(w && h ? { width: w, height: h, durationMs: d } : null);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    v.src = url;
  });

export interface UploadResult {
  attachment: AttachmentInput;
  previewUrl: string;
}

export const uploadCommentFile = async (
  taskId: string,
  file: File,
): Promise<UploadResult> => {
  const classified = classifyFile(file);
  if (!classified.ok) throw new Error(classified.reason);
  const kind = classified.kind;

  const meta =
    kind === "image"
      ? await probeImageDimensions(file)
      : await probeVideoMetadata(file);

  const res = await commentServices.createUploadUrl({
    taskId,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  const { uploadUrl, path, publicUrl } = res.data;

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Upload failed (${putRes.status})`);
  }

  return {
    attachment: {
      type: kind,
      storagePath: path,
      url: publicUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      width: meta?.width ?? null,
      height: meta?.height ?? null,
      durationMs:
        meta && "durationMs" in meta
          ? (meta as { durationMs: number }).durationMs ?? null
          : null,
    },
    previewUrl: publicUrl,
  };
};

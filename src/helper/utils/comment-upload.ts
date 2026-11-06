import { commentServices } from "@/services/comment.service";
import type { AttachmentInput } from "@/types";
import {
  classifyMime,
  maxBytesFor,
  type AttachmentKind,
} from "./attachment-kinds";

export { MAX_FILES_PER_COMMENT } from "./attachment-kinds";

const KIND_LABEL = { image: "Image", video: "Video", file: "File" } as const;

export const classifyFile = (
  file: File,
): { kind: AttachmentKind; ok: true } | { ok: false; reason: string } => {
  const kind = classifyMime(file.type);
  if (!kind) {
    return {
      ok: false,
      reason: `${file.name} isn’t a supported file type`,
    };
  }
  const max = maxBytesFor(kind);
  if (file.size > max) {
    return {
      ok: false,
      reason: `${KIND_LABEL[kind]} is over ${Math.round(max / 1024 / 1024)} MB`,
    };
  }
  return { kind, ok: true };
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

  // documents have no pixel size or duration to read
  const meta =
    kind === "image"
      ? await probeImageDimensions(file)
      : kind === "video"
        ? await probeVideoMetadata(file)
        : null;

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
      fileName: file.name.slice(0, 200),
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

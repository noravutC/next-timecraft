import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  classifyFile,
  MAX_FILES_PER_COMMENT,
  uploadCommentFile,
} from "@/helper/utils/comment-upload";
import type { AttachmentInput } from "@/types";

export type PendingFile = {
  id: string;
  file: File;
  previewUrl: string;
  kind: "image" | "video";
  status: "uploading" | "ready" | "error";
  attachment?: AttachmentInput;
  error?: string;
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useAttachmentUploads(taskId: string) {
  const [pending, setPending] = useState<PendingFile[]>([]);

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (pending.length + arr.length > MAX_FILES_PER_COMMENT) {
      toast.error(`Max ${MAX_FILES_PER_COMMENT} files per comment`);
      return;
    }
    for (const file of arr) {
      const cls = classifyFile(file);
      if (!cls.ok) {
        toast.error(cls.reason);
        continue;
      }
      const id = newId();
      const previewUrl = URL.createObjectURL(file);
      setPending((p) => [
        ...p,
        { id, file, previewUrl, kind: cls.kind, status: "uploading" },
      ]);
      uploadCommentFile(taskId, file)
        .then((res) => {
          setPending((p) =>
            p.map((x) =>
              x.id === id
                ? { ...x, status: "ready", attachment: res.attachment }
                : x,
            ),
          );
        })
        .catch((err) => {
          console.error(err);
          toast.error(err?.message || "Upload failed");
          setPending((p) =>
            p.map((x) =>
              x.id === id
                ? { ...x, status: "error", error: err?.message }
                : x,
            ),
          );
        });
    }
  };

  // Stable reference — passed into memo'd <AttachmentPreviewTile/>.
  const removePending = useCallback((id: string) => {
    setPending((p) => {
      const f = p.find((x) => x.id === id);
      if (f) URL.revokeObjectURL(f.previewUrl);
      return p.filter((x) => x.id !== id);
    });
  }, []);

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of Array.from(items)) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const clearAll = () => {
    pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPending([]);
  };

  return { pending, addFiles, removePending, onPaste, onDrop, clearAll };
}

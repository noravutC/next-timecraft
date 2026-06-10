import { memo } from "react";
import { Loader2, X } from "lucide-react";
import type { PendingFile } from "../use-attachment-uploads";

type Props = {
  pending: PendingFile;
  onRemove: (id: string) => void;
};

export const AttachmentPreviewTile = memo(function AttachmentPreviewTile({
  pending,
  onRemove,
}: Props) {
  return (
    <div className="group relative size-20 overflow-hidden rounded-md border border-border bg-muted">
      {pending.kind === "image" ? (
        <img
          src={pending.previewUrl}
          alt={pending.file.name}
          className="size-full object-cover"
        />
      ) : (
        <video
          src={pending.previewUrl}
          className="size-full object-cover"
          muted
        />
      )}
      {pending.status === "uploading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="size-4 animate-spin text-white" />
        </div>
      )}
      {pending.status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/70 text-xs text-white">
          Failed
        </div>
      )}
      <button
        type="button"
        onClick={() => onRemove(pending.id)}
        className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
});

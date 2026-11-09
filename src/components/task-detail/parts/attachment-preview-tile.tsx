import { memo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type { PendingFile } from "../use-attachment-uploads";
import { fileBadge } from "@/helper/utils/attachment-kinds";

type Props = {
  pending: PendingFile;
  onRemove: (id: string) => void;
};

export const AttachmentPreviewTile = memo(function AttachmentPreviewTile({
  pending,
  onRemove,
}: Props) {
  return (
    <div className="group relative size-20 overflow-hidden rounded-lg border border-line bg-surface">
      {pending.kind === "file" ? (
        <div className="flex size-full flex-col items-center justify-center gap-1 px-1.5 text-center">
          <span className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-2xs font-medium text-ink-muted">
            {fileBadge(pending.file.type)}
          </span>
          <span className="w-full truncate text-2xs text-ink-subtle">
            {pending.file.name}
          </span>
        </div>
      ) : pending.kind === "image" ? (
        // local blob: preview of a file being uploaded; nothing to optimize
        <Image
          src={pending.previewUrl}
          alt={pending.file.name}
          fill
          unoptimized
          className="object-cover"
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
          <Loader size="xs" onColor />
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

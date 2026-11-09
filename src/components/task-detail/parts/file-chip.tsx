import { Download } from 'lucide-react';
import { fileBadge, formatFileSize } from '@/helper/utils/attachment-kinds';
import { cn } from '@/lib/utils';

/** A document attached to a comment: type badge, name, size, download. */
export const FileChip = ({
  url,
  fileName,
  mimeType,
  sizeBytes,
}: {
  url: string;
  fileName: string | null;
  mimeType: string;
  sizeBytes: number;
}) => {
  const name = fileName || 'Attachment';
  const badge = fileBadge(mimeType);
  // Supabase sends Content-Disposition: attachment when ?download= is set,
  // so the browser saves the file under its own name
  const href = `${url}?download=${encodeURIComponent(name)}`;
  return (
    <a
      href={href}
      className="flex h-12 w-70 max-w-full items-center gap-2.5 rounded-lg border border-line bg-background pr-1.5 pl-2.5 text-ink hover:bg-surface"
      aria-label={`Download ${name}, ${formatFileSize(sizeBytes)}`}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-7.5 shrink-0 place-items-center rounded-md font-mono text-2xs font-medium',
          badge === 'PDF'
            ? 'bg-danger-soft text-danger-text'
            : 'bg-surface-hover text-ink-muted',
        )}
      >
        {badge}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="text-xs text-ink-subtle">
          {formatFileSize(sizeBytes)}
        </span>
      </span>
      <span
        aria-hidden
        className="grid size-7.5 shrink-0 place-items-center rounded-md text-ink-muted"
      >
        <Download className="size-3.75" />
      </span>
    </a>
  );
};

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Download the board: CSV (a task list) or JSON (everything). */
export const BoardExportRow = ({ projectId }: { projectId: string }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-popover border border-line px-4 py-3.5">
    <Download aria-hidden className="size-4 shrink-0 text-ink-subtle" />
    <span className="flex min-w-0 flex-1 basis-65 flex-col">
      <span className="text-base font-medium text-ink">Export</span>
      <span className="text-sm text-ink-subtle">
        Download every column, task, subtask and comment on this board.
      </span>
    </span>
    <span className="flex gap-2">
      {(['csv', 'json'] as const).map((format) => (
        <Button key={format} asChild variant="outline" size="sm">
          <a
            href={`/api/project/${projectId}/export?format=${format}`}
            download
          >
            {format.toUpperCase()}
          </a>
        </Button>
      ))}
    </span>
  </div>
);

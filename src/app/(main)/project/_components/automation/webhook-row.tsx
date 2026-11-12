'use client';

import { MoreHorizontal, Pencil, Trash2, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { WebhookRowView } from './automation-operations';

const STATUS: Record<WebhookRowView['tone'], { text: string; dot: string }> = {
  ok: { text: 'text-success-text', dot: 'bg-success' },
  failing: { text: 'text-danger-text', dot: 'bg-destructive' },
  off: { text: 'text-ink-subtle', dot: 'bg-ink-faint' },
};

/** One webhook: where it sends, what about, and how its last messages went. */
export const WebhookRow = ({
  row,
  onOpen,
  onToggle,
  onDelete,
  onFailed,
}: {
  row: WebhookRowView;
  onOpen: (webhookId: string) => void;
  onToggle: (webhookId: string, enabled: boolean) => void;
  onDelete: (webhookId: string) => void;
  /** to History, showing what was not accepted */
  onFailed: () => void;
}) => (
  <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line-soft p-3 first:border-t-0">
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center self-start rounded-lg bg-surface-hover text-ink-muted"
    >
      <Webhook className="size-4.25" />
    </span>
    <div className="flex min-w-0 grow basis-80 flex-col gap-1">
      <Button
        variant="link"
        size={null}
        onClick={() => onOpen(row.id)}
        className="h-auto justify-start self-start p-0 text-base font-medium"
      >
        {row.name}
      </Button>
      <span className="truncate font-mono text-xs text-ink-subtle">
        {row.url}
      </span>
      <ul className="flex flex-wrap gap-1.5 pt-1">
        {row.events.map((event) => (
          <li
            key={event}
            className="inline-flex h-5.5 items-center rounded-full bg-surface-hover px-2 text-xs font-medium text-ink-muted"
          >
            {event}
          </li>
        ))}
      </ul>
    </div>
    <div className="ml-auto flex shrink-0 items-center gap-3">
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium',
            STATUS[row.tone].text,
          )}
        >
          <span
            aria-hidden
            className={cn('size-1.75 rounded-full', STATUS[row.tone].dot)}
          />
          {row.status}
        </span>
        {row.tone === 'failing' ? (
          <Button
            variant="link"
            size={null}
            onClick={onFailed}
            className="h-auto p-0 text-xs font-normal underline"
          >
            See what failed
          </Button>
        ) : (
          row.sub && <span className="text-xs text-ink-subtle">{row.sub}</span>
        )}
      </div>
      <Switch
        checked={row.enabled}
        onCheckedChange={(next) => onToggle(row.id, next)}
        aria-label={`${row.enabled ? 'Turn off' : 'Turn on'}: ${row.name}`}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`More actions: ${row.name}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => onOpen(row.id)}>
            <Pencil />
            Edit webhook
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(row.id)}
          >
            <Trash2 />
            Delete webhook
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </li>
);

'use client';

import { Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TRIGGER_ICONS } from './automation-icons';
import type { HistoryRowView, HistoryTone } from './history-operations';

const CHIPS: Record<HistoryTone, string> = {
  good: 'bg-success-soft text-success-text',
  bad: 'bg-danger-soft text-danger-text',
  warn: 'bg-warning-soft text-warning-text',
  wait: 'bg-surface-hover text-ink-muted',
};

const MARKS: Record<HistoryRowView['tone'], string> = {
  change: 'bg-tone-violet text-tone-violet-fg',
  schedule: 'bg-tone-blue text-tone-blue-fg',
  hook: 'bg-surface-hover text-ink-muted',
};

/** One line of History; a message that was not accepted says why below it. */
export const HistoryRow = ({
  row,
  canResend,
  resending,
  onOpenTask,
  onResend,
  onCopy,
}: {
  row: HistoryRowView;
  /** may send a message again: owners and admins, outside the guest workspace */
  canResend: boolean;
  resending: boolean;
  onOpenTask: (taskId: string) => void;
  onResend: (deliveryId: string) => void;
  onCopy: (payload: string) => void;
}) => {
  const Icon = row.icon === 'webhook' ? Webhook : TRIGGER_ICONS[row.icon];
  return (
    <li className="flex flex-col border-t border-line-soft">
      <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5">
        <span className="w-10 shrink-0 text-xs text-ink-subtle tabular-nums">
          {row.time}
        </span>
        <span
          aria-hidden
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-md',
            MARKS[row.tone],
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span className="flex min-w-0 grow-2 basis-60 flex-col">
          <span className="truncate text-sm font-medium text-ink">
            {row.name}
          </span>
          <span className="text-xs text-ink-subtle">{row.sub}</span>
        </span>
        <span className="min-w-0 grow-2 basis-55 truncate text-sm text-ink">
          {row.taskId ? (
            <Button
              variant="link"
              size={null}
              onClick={() => row.taskId && onOpenTask(row.taskId)}
              className="h-auto max-w-full justify-start p-0 text-sm font-normal"
            >
              <span className="truncate">{row.task}</span>
            </Button>
          ) : (
            row.task
          )}
        </span>
        <span className="flex min-w-0 grow-2 basis-65 items-center gap-2">
          <span
            className={cn(
              'inline-flex h-5.5 shrink-0 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap',
              CHIPS[row.chip.tone],
            )}
          >
            {row.chip.text}
          </span>
          <span className="min-w-0 text-xs text-ink-muted">{row.detail}</span>
        </span>
      </div>
      {row.failure && (
        <div className="mx-3 mb-2.5 flex flex-col gap-2.5 rounded-lg border border-danger-line bg-danger-soft/40 p-3 sm:ml-26">
          <p className="text-sm leading-5 text-ink">
            {row.failure.lead}{' '}
            <span className="font-semibold">{row.failure.answer}</span>{' '}
            {row.failure.rest}
          </p>
          <pre
            tabIndex={0}
            aria-label="The request that was sent"
            className="overflow-x-auto rounded-lg border border-line-soft bg-background px-3 py-2.5 font-mono text-xs leading-4.5 text-ink-muted"
          >
            {row.failure.request}
          </pre>
          <div className="flex flex-wrap gap-2">
            {canResend && (
              <Button
                variant="outline"
                size="xs"
                disabled={resending}
                onClick={() => onResend(row.id)}
              >
                Send again now
              </Button>
            )}
            <Button
              variant="ghost"
              size="xs"
              onClick={() => row.failure && onCopy(row.failure.payload)}
            >
              Copy what was sent
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

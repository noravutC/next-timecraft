'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { HISTORY_DAYS } from '@/helper/utils/automation';
import { HistoryRow } from './history-row';
import type { History, HistoryKind } from './use-history';

const KINDS: { value: HistoryKind; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'rules', label: 'Rules' },
  { value: 'webhooks', label: 'Webhooks' },
];

/** What rules did and what webhooks were sent, by day, newest first. */
export const HistorySection = ({
  history,
  canManage,
  canResend,
  onOpenTask,
}: {
  history: History;
  /** webhook messages are only listed for those who manage them */
  canManage: boolean;
  canResend: boolean;
  onOpenTask: (taskId: string) => void;
}) => {
  const copy = (payload: string) =>
    void navigator.clipboard.writeText(payload).then(
      () => toast.success('Copied'),
      () => toast.error('Could not copy it'),
    );
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <SegmentedControl
            aria-label="Show"
            options={KINDS}
            value={history.kind}
            onChange={history.setKind}
            className="bg-surface-active"
          />
        )}
        <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-line bg-background px-2.5 text-sm font-medium text-ink">
          <Checkbox
            checked={history.failedOnly}
            onCheckedChange={(next) => history.setFailedOnly(next === true)}
          />
          Only what went wrong
        </label>
        <div className="flex-1" />
        <span className="text-xs text-ink-subtle">
          Kept for {HISTORY_DAYS} days
        </span>
      </div>

      {!history.loaded && !history.failed && (
        <Skeleton
          role="status"
          aria-label="Loading history"
          className="h-80 rounded-xl"
        />
      )}
      {history.failed && (
        <div
          role="alert"
          className="flex flex-col items-center gap-2.5 rounded-xl border border-line bg-background px-6 py-12 text-center"
        >
          <span className="text-sm text-ink-muted">
            Could not load the history.
          </span>
          <Button size="sm" variant="outline" onClick={history.retry}>
            Try again
          </Button>
        </div>
      )}
      {history.loaded && (
        <div className="flex flex-col rounded-xl border border-line bg-background p-1">
          {history.days.map((day) => (
            <section key={day.day} aria-label={day.day}>
              <h2 className="px-3 pt-3 pb-2 text-xs font-medium text-ink-subtle">
                {day.day}
              </h2>
              <ul className="flex flex-col">
                {day.rows.map((row) => (
                  <HistoryRow
                    key={`${row.kind}-${row.id}`}
                    row={row}
                    canResend={canResend}
                    resending={history.busy === row.id}
                    onOpenTask={onOpenTask}
                    onResend={history.resend}
                    onCopy={copy}
                  />
                ))}
              </ul>
            </section>
          ))}
          {history.days.length === 0 && (
            <p className="px-3 py-12 text-center text-sm text-ink-subtle">
              {history.failedOnly
                ? 'Nothing here went wrong.'
                : 'Nothing has run yet. Rules and webhooks show up here as they do.'}
            </p>
          )}
          {history.hasMore && (
            <Button
              variant="ghost"
              size="sm"
              disabled={history.busy === 'more'}
              onClick={history.loadMore}
              className="m-2 self-center"
            >
              Show older
            </Button>
          )}
        </div>
      )}
    </>
  );
};

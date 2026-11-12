'use client';

import { Activity, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ActivityEntry } from './parts/activity-entry';
import { useTaskActivityList } from './use-task-activity-list';

/** The Activity tab: the task's history by day, on a timeline rail. */
export const TaskActivityList = ({ taskId }: { taskId: string }) => {
  const {
    days,
    loading,
    failed,
    empty,
    hasMore,
    loadingMore,
    loadMore,
    retry,
    newestFirst,
    toggleOrder,
  } = useTaskActivityList(taskId);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader size="sm" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="text-sm text-ink-muted">
          Couldn’t load the history.
        </span>
        <Button variant="outline" size="xs" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-10 text-center">
        <span className="mb-1 grid size-9 place-items-center rounded-lg border border-line text-ink-subtle">
          <Activity className="size-4" />
        </span>
        <span className="text-base font-medium text-ink">
          No changes recorded yet
        </span>
        <span className="text-sm text-ink-subtle">
          Moves, edits and assignments show up here as they happen.
        </span>
      </div>
    );
  }

  const more = hasMore && (
    <Button
      variant="ghost"
      size="xs"
      onClick={loadMore}
      disabled={loadingMore}
      className="self-start text-ink-muted"
    >
      {loadingMore ? 'Loading…' : 'Load older activity'}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4.5">
      <div className="-mt-2 flex justify-end">
        <Button
          variant="ghost"
          size="xs"
          onClick={toggleOrder}
          aria-label={
            newestFirst
              ? 'Showing newest first. Show oldest first.'
              : 'Showing oldest first. Show newest first.'
          }
          className="text-ink-muted"
        >
          <ArrowDownUp className="size-3.25" />
          {newestFirst ? 'Newest first' : 'Oldest first'}
        </Button>
      </div>
      {!newestFirst && more}
      {days.map((day) => (
        <section key={day.key} aria-label={day.label}>
          <h4 className="mb-1.5 text-xs font-medium text-ink-subtle">
            {day.label}
          </h4>
          <ol className="flex flex-col">
            {day.rows.map((row, i) => (
              <ActivityEntry
                key={row.id}
                actorName={row.actorName}
                line={row.line}
                rule={row.rule}
                time={row.time}
                last={i === day.rows.length - 1}
              />
            ))}
          </ol>
        </section>
      ))}
      {newestFirst && more}
    </div>
  );
};

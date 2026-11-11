import type { InsightsWait } from '@/types';
import { waitNote, waitRows } from './insights-operations';

/** How long finished tasks sat in each column on their way to Done. */
export const WaitCard = ({
  waits,
  tasks,
  weeks,
}: {
  waits: InsightsWait[];
  /** how many finished tasks the averages are taken over */
  tasks: number;
  weeks: number;
}) => (
  <section
    aria-label="Time in each column"
    className="flex min-w-0 grow basis-85 flex-col gap-3.5 rounded-xl border border-line bg-background p-4.5"
  >
    <div className="flex flex-col gap-0.5">
      <h2 className="text-base font-semibold text-ink">Time in each column</h2>
      <span className="text-xs text-ink-subtle">
        How long a task usually sits in each one before Done
      </span>
    </div>
    <ul className="mt-1 flex flex-col gap-4">
      {(tasks ? waitRows(waits) : []).map((row) => (
        <li key={row.id} className="flex flex-col gap-1.5">
          <div className="flex min-h-5 items-center gap-2">
            <span className="min-w-0 truncate text-sm text-ink">
              {row.name}
            </span>
            {row.slowest && (
              <span className="inline-flex h-4.5 shrink-0 items-center rounded-full bg-warning-tint px-1.75 text-2xs font-medium text-warning-text">
                Slowest
              </span>
            )}
            <span className="flex-1" />
            <span className="text-sm font-semibold text-ink tabular-nums">
              {row.value}
            </span>
            <span className="text-xs text-ink-subtle">{row.unit}</span>
          </div>
          <div aria-hidden className="h-2.5 rounded-full bg-surface-hover">
            {/* in the column's own color, as on the board */}
            <div
              className="h-2.5 rounded-full"
              style={{ width: `${row.percent}%`, backgroundColor: row.color }}
            />
          </div>
        </li>
      ))}
    </ul>
    <div className="flex-1" />
    <p className="border-t border-line-soft pt-3 text-sm text-ink-muted">
      {waitNote(waits, tasks, weeks)}
    </p>
  </section>
);

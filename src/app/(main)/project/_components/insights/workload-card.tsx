import type { InsightsWorkload } from '@/types';
import { workloadRows } from './insights-operations';
import { PersonMark } from './person-mark';

/**
 * Who is holding what: open and overdue now, finished in the period. In a
 * narrow card each person's bar drops under their name and numbers.
 */
export const WorkloadCard = ({
  workload,
  weeks,
}: {
  workload: InsightsWorkload[];
  weeks: number;
}) => (
  <section
    aria-label="Workload"
    className="@container flex min-w-0 grow basis-95 flex-col rounded-xl border border-line bg-background p-4.5"
  >
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pb-1.5">
      <h2 className="text-base font-semibold text-ink">Workload</h2>
      <span className="text-xs text-ink-subtle">
        Open now, and finished in the last {weeks} weeks
      </span>
    </div>
    {workload.length === 0 ? (
      <p className="text-sm text-ink-muted">No open or finished tasks yet.</p>
    ) : (
      <ul className="flex flex-col">
        {workloadRows(workload).map((row) => (
          <li
            key={row.key}
            className="flex min-h-10 items-center gap-x-2.5 gap-y-1.5 border-b border-surface-hover text-sm text-ink @max-xs:flex-wrap @max-xs:py-2"
          >
            <PersonMark person={row.person} />
            <span className="min-w-0 shrink basis-23 truncate @max-xs:flex-1">
              {row.name}
            </span>
            {/* open tasks as a bar: the overdue ones first, in red like
                their count beside it */}
            <span
              aria-hidden
              className="flex h-2.5 min-w-10 flex-1 gap-0.5 overflow-hidden rounded-full bg-surface-hover @max-xs:order-last @max-xs:basis-full"
            >
              {row.overdue > 0 && (
                <span
                  className="h-full bg-danger-text"
                  style={{ width: `${row.latePercent}%` }}
                />
              )}
              <span
                className="h-full rounded-r-full bg-brand"
                style={{ width: `${row.restPercent}%` }}
              />
            </span>
            <span className="flex w-16 shrink-0 flex-col">
              <span>
                <span className="font-semibold tabular-nums">{row.open}</span>{' '}
                <span className="text-ink-subtle">open</span>
              </span>
              {row.overdue > 0 && (
                <span className="text-xs text-danger-text tabular-nums">
                  {row.overdue} overdue
                </span>
              )}
            </span>
            <span className="w-19 shrink-0 text-right text-xs text-ink-subtle tabular-nums">
              {row.done}
            </span>
          </li>
        ))}
      </ul>
    )}
  </section>
);

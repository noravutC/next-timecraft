import { cn } from '@/lib/utils';
import type { BoardInsights } from '@/types';
import { tasksChart } from './insights-operations';

type Weeks = BoardInsights['completed']['byWeek'];

const SERIES = [
  {
    key: 'finished',
    percent: 'finishedPercent',
    label: 'Finished',
    className: 'bg-brand',
  },
  {
    key: 'created',
    percent: 'createdPercent',
    label: 'New',
    className: 'bg-chart-2',
  },
] as const;

/** In a narrow chart the first and last tooltips hug their side of it. */
const TIP_AT = {
  start: '@max-3xl:left-0 @3xl:left-1/2 @3xl:-translate-x-1/2',
  end: '@max-3xl:right-0 @3xl:left-1/2 @3xl:-translate-x-1/2',
  middle: 'left-1/2 -translate-x-1/2',
};

/**
 * Tasks finished and tasks added, as a pair of bars per week. The week
 * still running is lighter; each pair shows its numbers on hover or
 * keyboard focus. "Narrow" goes by the chart's own width: beside another
 * card it can be narrow in a wide window.
 */
export const FlowChart = ({
  finished,
  created,
}: {
  finished: Weeks;
  created: Weeks;
}) => {
  const { bars, ticks, average, note } = tasksChart(finished, created);
  return (
    <section
      aria-label="New and finished tasks"
      className="@container flex min-w-0 grow-999 basis-140 flex-col gap-3.5 rounded-xl border border-line bg-background px-4.5 pt-4.5 pb-3.5"
    >
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h2 className="text-base font-semibold text-ink">
          New and finished tasks
        </h2>
        <span className="flex-1 text-xs whitespace-nowrap text-ink-subtle">
          Each week · {average} finished a week on average
        </span>
        <ul className="flex items-center gap-3.5 text-xs text-ink-muted">
          {SERIES.map((series) => (
            <li key={series.key} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn('size-2.5 rounded-sm', series.className)}
              />
              {series.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative min-h-57.5 flex-1">
        {ticks.map((tick) => (
          <div
            key={tick.value}
            aria-hidden
            className="absolute inset-x-0 border-t border-line-soft"
            style={{ bottom: `${tick.percent}%` }}
          >
            <span className="absolute -top-2 left-0 w-5 bg-background text-right text-2xs text-ink-subtle tabular-nums">
              {tick.value}
            </span>
          </div>
        ))}
        <div className="absolute inset-y-0 right-0 left-7 flex items-stretch">
          {bars.map((bar) => (
            <div
              key={bar.key}
              role="img"
              tabIndex={0}
              aria-label={bar.summary}
              className="group relative flex min-w-0 flex-1 items-end justify-center gap-0.5 rounded-t-md px-px outline-none hover:bg-surface-hover focus-visible:bg-surface-hover"
            >
              {SERIES.map((series) => (
                <span
                  key={series.key}
                  className={cn(
                    'block w-3/10 max-w-6.5 rounded-t',
                    series.className,
                    bar.partial && 'opacity-50',
                  )}
                  style={{ height: `${bar[series.percent]}%` }}
                />
              ))}
              <span
                role="tooltip"
                className={cn(
                  'pointer-events-none absolute z-10 hidden flex-col gap-0.5 rounded-lg border border-line bg-background px-2.5 py-2 text-left whitespace-nowrap shadow-popover group-hover:flex group-focus-visible:flex',
                  TIP_AT[bar.edge ?? 'middle'],
                )}
                style={{ bottom: `calc(${bar.peakPercent}% + 8px)` }}
              >
                <span className="text-2xs text-ink-subtle">{bar.span}</span>
                {SERIES.map((series) => (
                  <span
                    key={series.key}
                    className="flex items-center gap-1.5 text-sm text-ink-muted"
                  >
                    <span
                      aria-hidden
                      className={cn('size-2 rounded-xs', series.className)}
                    />
                    <span className="flex-1 pr-3">{series.label}</span>
                    <span className="font-semibold text-ink tabular-nums">
                      {bar[series.key]}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden className="ml-7 flex">
        {bars.map((bar) => (
          <span
            key={bar.key}
            className={cn(
              'relative h-4 min-w-0 flex-1 text-2xs',
              bar.partial ? 'font-medium text-ink' : 'text-ink-subtle',
              !bar.labelWhenNarrow && '@max-3xl:invisible',
            )}
          >
            {/* narrow: centered on the bars and free to run past its slot,
                since the labels beside it are hidden */}
            <span
              className={cn(
                'block text-center whitespace-nowrap @max-3xl:absolute @3xl:overflow-hidden',
                // the last one hugs the right edge instead of running past it
                bar.partial
                  ? '@max-3xl:right-0'
                  : '@max-3xl:left-1/2 @max-3xl:-translate-x-1/2',
              )}
            >
              {bar.label}
            </span>
          </span>
        ))}
      </div>

      <p className="border-t border-line-soft pt-3 text-sm text-ink-muted">
        {note}
      </p>
    </section>
  );
};

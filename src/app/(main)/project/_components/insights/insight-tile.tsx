import {
  ArrowDown,
  ArrowUp,
  CalendarCheck,
  CircleCheck,
  Clock,
  SquareKanban,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InsightTile as Tile, TileKey } from './insights-operations';
import { ShareRing } from './share-ring';

const MARKS: Record<TileKey, { icon: LucideIcon; className: string }> = {
  finished: {
    icon: CircleCheck,
    className: 'bg-tone-violet text-tone-violet-fg',
  },
  time: { icon: Clock, className: 'bg-tone-blue text-tone-blue-fg' },
  onTime: {
    icon: CalendarCheck,
    className: 'bg-tone-green text-tone-green-fg',
  },
  open: { icon: SquareKanban, className: 'bg-surface-hover text-ink-muted' },
  overdue: {
    icon: TriangleAlert,
    className: 'bg-surface-hover text-ink-muted',
  },
};

/**
 * One headline number: its mark and label, the number, and how it moved or
 * what it counts. Goes inside a `dl`.
 */
export const InsightTile = ({ tile }: { tile: Tile }) => {
  const mark = MARKS[tile.key];
  const Arrow = tile.chip?.arrow === 'down' ? ArrowDown : ArrowUp;
  return (
    <div className="flex min-w-0 flex-1 basis-37.5 flex-col gap-2 rounded-xl border border-line bg-background px-4.5 py-4">
      <dt className="flex items-center gap-2 text-sm text-ink-muted">
        <span
          aria-hidden
          className={cn(
            'grid size-6.5 shrink-0 place-items-center rounded-lg',
            tile.alert ? 'bg-danger-soft text-danger-text' : mark.className,
          )}
        >
          <mark.icon className="size-3.5 stroke-2" />
        </span>
        {tile.label}
      </dt>
      <dd className="flex flex-col gap-2">
        <span className="flex items-end gap-3">
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight whitespace-nowrap text-ink tabular-nums">
              {tile.value}
            </span>
            {tile.unit && (
              <span className="text-sm text-ink-subtle">{tile.unit}</span>
            )}
          </span>
          {/* taller than the number: it rises beside the label */}
          {tile.ring !== undefined && (
            <ShareRing percent={tile.ring} className="-mt-5" />
          )}
        </span>
        <span className="flex min-h-5 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-subtle">
          {tile.chip && (
            <span
              className={cn(
                'inline-flex h-5 items-center gap-0.5 rounded-full pr-1.75 pl-1.25 font-medium whitespace-nowrap',
                tile.chip.good
                  ? 'bg-success-soft text-success-text'
                  : 'bg-surface-hover text-ink-muted',
              )}
            >
              <Arrow aria-hidden className="size-3 stroke-2" />
              {tile.chip.text}
            </span>
          )}
          <span>{tile.note}</span>
        </span>
      </dd>
    </div>
  );
};

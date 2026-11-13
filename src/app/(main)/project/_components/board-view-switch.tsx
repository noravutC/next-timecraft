'use client';

import { CalendarDays, ChartColumn, SquareKanban, Zap } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useNavStore, type BoardView } from '@/store/use-nav.store';

const OPTIONS = [
  {
    value: 'board' as const,
    label: (
      <span className="flex items-center gap-1.5">
        <SquareKanban className="size-3.5 max-sm:hidden" />
        Board
      </span>
    ),
  },
  {
    value: 'calendar' as const,
    label: (
      <span className="flex items-center gap-1.5">
        <CalendarDays className="size-3.5 max-sm:hidden" />
        Calendar
      </span>
    ),
  },
  {
    value: 'insights' as const,
    label: (
      <span className="flex items-center gap-1.5">
        <ChartColumn className="size-3.5 max-sm:hidden" />
        Insights
      </span>
    ),
  },
  {
    value: 'automation' as const,
    label: (
      <span className="flex items-center gap-1.5">
        <Zap className="size-3.5 max-sm:hidden" />
        Automation
      </span>
    ),
  },
];

/**
 * Columns, a month of due dates, the numbers or the rules; kept in the
 * link. On a phone the icons step aside so all four fit.
 */
export const BoardViewSwitch = () => {
  const view = useNavStore((s) => s.boardView);
  const setView = useNavStore((s) => s.setBoardView);
  return (
    <SegmentedControl<BoardView>
      aria-label="Board view"
      options={OPTIONS}
      value={view}
      onChange={setView}
    />
  );
};

'use client';

import { CalendarDays, ChartColumn, SquareKanban } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useNavStore, type BoardView } from '@/store/use-nav.store';

const OPTIONS = [
  {
    value: 'board' as const,
    label: (
      <span className="flex items-center gap-1.5">
        <SquareKanban className="size-3.5" />
        Board
      </span>
    ),
  },
  {
    value: 'calendar' as const,
    label: (
      <span className="flex items-center gap-1.5">
        <CalendarDays className="size-3.5" />
        Calendar
      </span>
    ),
  },
  {
    value: 'insights' as const,
    label: (
      <span className="flex items-center gap-1.5">
        <ChartColumn className="size-3.5" />
        Insights
      </span>
    ),
  },
];

/** Columns, a month of due dates or the numbers; kept in the link. */
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

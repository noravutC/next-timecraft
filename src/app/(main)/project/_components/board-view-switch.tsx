'use client';

import { CalendarDays, SquareKanban } from 'lucide-react';
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
];

/** Columns or a month of due dates; the choice is kept in the link. */
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

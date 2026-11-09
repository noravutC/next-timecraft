'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBoardAccess } from '@/components/project/use-board-access';
import { useNavStore } from '@/store';
import {
  AssigneeFilterMenu,
  LabelFilterMenu,
  PriorityFilterMenu,
} from '../board-filter-menus';
import { BoardViewSwitch } from '../board-view-switch';
import { useBoardFilterBar } from '../use-board-filter-bar';
import { SubscribePopover } from './subscribe-popover';

/** The calendar's toolbar: view, month and filters, Subscribe, New task. */
export const CalendarToolbar = ({
  projectId,
  boardName,
  columnIds,
  monthLabel,
  onToday,
  onMove,
}: {
  projectId: string | null;
  boardName: string;
  columnIds: string[];
  monthLabel: string;
  onToday: () => void;
  onMove: (by: number) => void;
}) => {
  const filter = useBoardFilterBar(
    columnIds.map((id) => ({ id, totalTasks: 0 })),
  );
  const setBoardView = useNavStore((s) => s.setBoardView);
  const requestNewTask = useNavStore((s) => s.requestNewTask);
  const canAddTasks = useBoardAccess().can('task:create');

  // New task opens the composer on the board; columns only notice the
  // signal once they're on screen, hence the next tick
  const newTask = () => {
    setBoardView('board');
    setTimeout(requestNewTask, 0);
  };

  return (
    <div className="flex min-h-13 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-background px-5 py-2.25">
      <BoardViewSwitch />
      <span aria-hidden className="mx-1 hidden h-5 w-px bg-line sm:block" />
      <Button
        variant="outline"
        size="sm"
        className="border-line"
        onClick={onToday}
      >
        Today
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous month"
        onClick={() => onMove(-1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next month"
        onClick={() => onMove(1)}
      >
        <ChevronRight className="size-4" />
      </Button>
      <h2 className="ml-1 text-md font-semibold text-ink">{monthLabel}</h2>
      <div className="flex-1" />
      <PriorityFilterMenu filter={filter} />
      <LabelFilterMenu filter={filter} />
      <AssigneeFilterMenu filter={filter} />
      {projectId && (
        <SubscribePopover
          key={projectId}
          projectId={projectId}
          boardName={boardName}
        />
      )}
      <Button size="sm" onClick={newTask} disabled={!canAddTasks}>
        <Plus className="size-3.75 stroke-2" />
        <span className="sr-only sm:not-sr-only">New task</span>
      </Button>
    </div>
  );
};

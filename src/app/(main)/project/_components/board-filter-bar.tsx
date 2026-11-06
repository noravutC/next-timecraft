'use client';

import { Plus, Search, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { BOARD_SEARCH_ID } from '@/helper/utils/shortcuts';
import { useNavStore } from '@/store';
import { useBoardAccess } from '@/components/project/use-board-access';
import {
  AssigneeFilterMenu,
  DueFilterMenu,
  LabelFilterMenu,
  PriorityFilterMenu,
} from './board-filter-menus';
import { BoardViewSwitch } from './board-view-switch';
import { BoardFilterChips } from './board-filter-chips';
import { useBoardFilterBar } from './use-board-filter-bar';
import { AiBreakdown } from './ai-breakdown';
import type { TColumn } from './data';

// แถบเครื่องมือของบอร์ด: ซ้าย = ค้นหา + ตัวกรอง, ขวา = AI / ตั้งค่า / New task
// แถวล่าง (เมื่อมี filter) = Showing X of Y + chips ของค่าที่เลือกไว้ + Clear all
export function BoardFilterBar({ columns }: { columns: TColumn[] }) {
  const filter = useBoardFilterBar(columns);
  const { draft, setDraft, activeCount } = filter;
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);
  const requestNewTask = useNavStore((s) => s.requestNewTask);
  const access = useBoardAccess();
  const canAddTasks = access.can('task:create');
  const addTasksBlockedReason = access.archived
    ? 'Restore the board to add tasks'
    : 'Viewers can’t add tasks';

  return (
    <>
      {/* wraps on narrow screens: search gets its own row on phones;
          at desktop width it is the same single 52px row */}
      <div className="flex min-h-13 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-background px-5 py-2.25">
        <BoardViewSwitch />
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-line sm:block" />
        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.75 -translate-y-1/2 text-ink-subtle" />
          <Input
            id={BOARD_SEARCH_ID}
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            aria-keyshortcuts="/"
            className="w-full border-line pr-8 pl-8 sm:w-40 lg:w-65"
            data-testid="board-filter-search"
          />
          {!draft && (
            <Kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 sm:inline-grid">
              /
            </Kbd>
          )}
        </div>

        <PriorityFilterMenu filter={filter} withCounts />

        <DueFilterMenu filter={filter} />

        <LabelFilterMenu filter={filter} />

        <AssigneeFilterMenu filter={filter} />

        <div className="flex-1" />

        {canAddTasks && <AiBreakdown columns={columns} />}
        <Button
          variant="outline"
          size="icon"
          className="border-line text-ink-muted"
          aria-label="Board settings"
          onClick={() => setBoardDialog('settings')}
        >
          <Settings2 className="size-3.75" />
        </Button>
        <Button
          size="sm"
          onClick={requestNewTask}
          disabled={!columns.length || !canAddTasks}
          title={canAddTasks ? undefined : addTasksBlockedReason}
        >
          <Plus className="size-3.75 stroke-2" />
          <span className="sr-only sm:not-sr-only">New task</span>
        </Button>
      </div>

      {activeCount > 0 && <BoardFilterChips filter={filter} />}
    </>
  );
}

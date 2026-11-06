'use client';

import { Plus } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { TColumn } from './data';
import { blockBoardPanningAttr } from './data-attributes';
import { Card, CardShadow } from './card';
import { useTaskStore } from '@/store/use-task.store';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { useNavStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useColumnStore } from '@/store/use-column.store';
import { useBoardFilterStore } from '@/store/use-board-filter.store';
import { AddCardInline } from './add-card-inline';
import { CardSkeleton } from './card-skeleton';
import { TColumnState, useColumnDnd } from './use-column-dnd';

const stateStyles: Record<TColumnState['type'], string> = {
  idle: 'cursor-grab',
  'is-card-over': 'outline outline-2 outline-brand-line',
  'is-dragging': 'opacity-40',
  'is-column-over': 'bg-gray-50',
};

const CardList = memo(function CardList({
  column,
  allColumns,
}: {
  column: TColumn;
  allColumns: TColumn[];
}) {
  return column.cards.map((card) => (
    <Card
      key={card.id}
      card={card}
      columnId={column.id}
      allColumns={allColumns}
    />
  ));
});

export const Column = ({
  column,
  allColumns,
}: {
  column: TColumn;
  allColumns: TColumn[];
}) => {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const outerFullHeightRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const isFiltering = useBoardFilterStore(
    (s) => s.toFilterPayload() !== undefined,
  );
  const loadMoreTasks = useTaskStore((s) => s.loadMoreTasks);
  const isLoadingMore = useTaskStore(
    (s) => s.loadMoreLoader[column.id] ?? false,
  );
  const columnsLoader = useColumnStore(useShallow((s) => s.columnsLoader));
  const isLoading = columnsLoader[column.id] ?? false;
  const state = useColumnDnd({
    column,
    outerRef: outerFullHeightRef,
    scrollableRef,
    headerRef,
    innerRef,
  });
  // composer เปิดตรงไหน การ์ดใหม่ลงตรงนั้น: '+' บน header → top, ปุ่มล่าง → bottom
  const [addingAt, setAddingAt] = useState<'top' | 'bottom' | null>(null);

  // ปุ่ม "New task" บนแถบเครื่องมือ → เปิด composer บนสุดของ column แรก
  // (ปรับ state ระหว่าง render ตาม signal ที่เปลี่ยน แทน useEffect)
  const newTaskSignal = useNavStore((s) => s.newTaskSignal);
  const [seenSignal, setSeenSignal] = useState(newTaskSignal);
  if (newTaskSignal !== seenSignal) {
    setSeenSignal(newTaskSignal);
    if (allColumns[0]?.id === column.id) setAddingAt('top');
  }

  // เลื่อนใกล้ท้าย list แล้วยังมี task เหลือ → โหลดเพิ่มทีละ TASK_PAGE_SIZE
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    const root = scrollableRef.current;
    if (!column.hasMore || isLoading || !sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreTasks(column.id).catch(() => {});
        }
      },
      { root, rootMargin: '120px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [column.id, column.hasMore, isLoading, loadMoreTasks]);

  return (
    <div
      className="flex h-full w-67 shrink-0 flex-col select-none"
      ref={outerFullHeightRef}
      data-testid="board-column"
      data-column-name={column.title}
    >
      <div
        className={cn(
          `flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line-soft bg-surface text-ink ${stateStyles[state.type]}`,
        )}
        ref={innerRef}
        {...{ [blockBoardPanningAttr]: true }}
      >
        <div
          className={`flex max-h-full min-h-0 flex-1 flex-col ${state.type === 'is-column-over' ? 'invisible' : ''}`}
        >
          <div
            className="flex h-11 flex-row items-center gap-2 pr-1.5 pl-3.5"
            ref={headerRef}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: column.color ?? '#94A3B8' }}
            />
            <h2 className="truncate text-sm font-semibold text-ink">
              {column.title}
            </h2>
            <span
              className={cn(
                'font-mono text-xs',
                column.wipLimit > 0 && column.totalTasks > column.wipLimit
                  ? 'font-medium text-destructive'
                  : 'text-ink-subtle',
              )}
            >
              {column.wipLimit > 0
                ? `${column.totalTasks}/${column.wipLimit}`
                : column.totalTasks}
            </span>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAddingAt('top')}
              aria-label={`Add a card to the top of ${column.title}`}
              disabled={isLoading}
              className="size-7 text-ink-subtle hover:bg-surface-active hover:text-ink"
            >
              <Plus className="size-3.75" />
            </Button>
          </div>
          {addingAt === 'top' && (
            <AddCardInline
              columnId={column.id}
              position="top"
              prevOrderFraction={null}
              nextOrderFraction={
                column.cards[0]?.orderFraction ?? column.nextCursorFraction
              }
              onClose={() => setAddingAt(null)}
            />
          )}
          <div
            className={
              'scrollbar-thin-y scrollbar-light flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto [overflow-anchor:none]'
            }
            ref={scrollableRef}
          >
            {isLoading ? (
              <div className="flex flex-col gap-2 px-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : (
              <CardList column={column} allColumns={allColumns} />
            )}
            {!isLoading && column.hasMore && (
              <div
                ref={loadMoreSentinelRef}
                aria-hidden
                className="h-px flex-shrink-0"
              />
            )}
            {isLoadingMore && (
              <div className="flex flex-shrink-0 justify-center py-2">
                <Loader size="sm" />
              </div>
            )}
            {!isLoading &&
              column.cards.length === 0 &&
              state.type !== 'is-card-over' && (
                <div className="mx-2 grid h-18 shrink-0 place-items-center rounded-lg border border-dashed border-input text-xs text-ink-subtle">
                  {isFiltering ? 'No matching tasks' : 'No tasks yet'}
                </div>
              )}
            {state.type === 'is-card-over' && !state.isOverChildCard && (
              <div className="flex-shrink-0 px-2 py-1">
                <CardShadow dragging={state.dragging} />
              </div>
            )}
          </div>
          {addingAt === 'bottom' ? (
            <AddCardInline
              columnId={column.id}
              position="bottom"
              prevOrderFraction={column.cards.at(-1)?.orderFraction ?? null}
              nextOrderFraction={column.nextCursorFraction}
              onClose={() => setAddingAt(null)}
            />
          ) : (
            <div className="mx-2 mt-1.5 mb-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddingAt('bottom')}
                disabled={isLoading}
                aria-label={`Add a card to the bottom of ${column.title}`}
                className="w-full justify-start px-2 font-normal text-ink-subtle hover:bg-surface-active hover:text-ink"
              >
                <Plus className="size-3.5" />
                Add card
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
import { ColumnHeader } from './column-header';
import { useColumnActions } from './use-column-actions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { deleteColumnMessage } from '@/helper/utils/column-copy';
import { useBoardAccess } from '@/components/project/use-board-access';

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
  const access = useBoardAccess();
  const canAddCards = access.can('task:create');
  const canManage = access.can('column:update');
  const actions = useColumnActions(column, allColumns);
  const state = useColumnDnd({
    column,
    // a column being renamed stays put
    canDrag: canManage && !actions.renaming,
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
          <ColumnHeader
            column={column}
            headerRef={headerRef}
            actions={actions}
            canAddCards={canAddCards}
            canManage={canManage}
            loading={isLoading}
            onAddTop={() => setAddingAt('top')}
          />
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
          ) : !canAddCards ? (
            <div aria-hidden className="h-2 shrink-0" />
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
      <ConfirmDialog
        open={actions.confirmDelete}
        onOpenChange={actions.setConfirmDelete}
        variant="destructive"
        title={`Delete the ${column.title} column?`}
        description={deleteColumnMessage(column.totalTasks)}
        primaryLabel="Delete column"
        onConfirm={actions.remove}
      />
    </div>
  );
};

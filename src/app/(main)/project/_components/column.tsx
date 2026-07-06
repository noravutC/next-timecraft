'use client';

import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
import { Plus } from 'lucide-react';
import { memo, useContext, useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import {
  getColumnData,
  isCardData,
  isCardDropTargetData,
  isColumnData,
  isDraggingACard,
  isDraggingAColumn,
  TCardData,
  TColumn,
} from './data';
import { blockBoardPanningAttr } from './data-attributes';
import { isSafari } from './is-safari';
import { isShallowEqual } from './is-shallow-equal';
import { Card, CardShadow } from './card';
import { SettingsContext } from '@/context/kanban/setting-provider';
import { TASK_PAGE_SIZE, useTaskStore } from '@/store/use-task.store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useShallow } from 'zustand/react/shallow';
import { useColumnStore } from '@/store/use-column.store';
import { useBoardFilterStore } from '@/store/use-board-filter.store';
import { AddCardInline } from './add-card-inline';

type TColumnState =
  | { type: 'idle' }
  | { type: 'is-dragging' }
  | { type: 'is-column-over' }
  | { type: 'is-card-over'; isOverChildCard: boolean; dragging: DOMRect };

const stateStyles: Record<TColumnState['type'], string> = {
  idle: 'cursor-grab',
  'is-card-over': 'outline outline-2 outline-brand-line',
  'is-dragging': 'opacity-40',
  'is-column-over': 'bg-gray-200',
};

const idle: TColumnState = { type: 'idle' };

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
  // ref เก็บ column ล่าสุด ป้องกัน effect re-run ทุกครั้งที่ card เปลี่ยน
  const columnRef = useRef(column);
  columnRef.current = column;

  const { settings } = useContext(SettingsContext);
  const fetchTasksByColumns = useTaskStore((s) => s.fetchTasksByColumns);
  // key เปลี่ยนเมื่อ filter เปลี่ยน → refetch หน้าแรกของ column ด้วยเงื่อนไขใหม่
  const filterKey = useBoardFilterStore(
    (s) =>
      `${s.q}|${s.priorities.join(',')}|${s.tags.join(',')}|${s.assigneeIds.join(',')}`,
  );
  const loadMoreTasks = useTaskStore((s) => s.loadMoreTasks);
  const isLoadingMore = useTaskStore(
    (s) => s.loadMoreLoader[column.id] ?? false,
  );
  const columnsLoader = useColumnStore(useShallow((s) => s.columnsLoader));
  const isLoading = columnsLoader[column.id] ?? false;
  const [state, setState] = useState<TColumnState>(idle);
  // composer เปิดตรงไหน การ์ดใหม่ลงตรงนั้น: '+' บน header → top, ปุ่มล่าง → bottom
  const [addingAt, setAddingAt] = useState<'top' | 'bottom' | null>(null);

  // fetch task หน้าแรกของ column นี้เมื่อ mount และทุกครั้งที่ filter เปลี่ยน
  useEffect(() => {
    fetchTasksByColumns([column.id], TASK_PAGE_SIZE).catch(() => {});
  }, [column.id, fetchTasksByColumns, filterKey]);

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

  useEffect(() => {
    const outer = outerFullHeightRef.current;
    const scrollable = scrollableRef.current;
    const header = headerRef.current;
    const inner = innerRef.current;
    invariant(outer && scrollable && header && inner);

    const getColData = () => getColumnData({ column: columnRef.current });

    const setIsCardOver = ({
      data,
      location,
    }: {
      data: TCardData;
      location: DragLocationHistory;
    }) => {
      const isOverChildCard = Boolean(
        location.current.dropTargets[0] &&
        isCardDropTargetData(location.current.dropTargets[0].data),
      );
      const proposed: TColumnState = {
        type: 'is-card-over',
        dragging: data.rect,
        isOverChildCard,
      };
      setState((cur) => (isShallowEqual(proposed, cur) ? cur : proposed));
    };

    const scrollConfig = { maxScrollSpeed: settings.columnScrollSpeed };
    const canCardScroll = ({
      source,
    }: {
      source: { data: Record<string | symbol, unknown> };
    }) =>
      settings.isOverElementAutoScrollEnabled && isDraggingACard({ source });

    return combine(
      draggable({
        element: header,
        getInitialData: getColData,
        onGenerateDragPreview({ source, location, nativeSetDragImage }) {
          invariant(isColumnData(source.data));
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element: header,
              input: location.current.input,
            }),
            render({ container }) {
              const rect = inner.getBoundingClientRect();
              const preview = inner.cloneNode(true) as HTMLElement;
              preview.style.width = `${rect.width}px`;
              preview.style.height = `${rect.height}px`;
              if (!isSafari()) preview.style.transform = 'rotate(4deg)';
              container.appendChild(preview);
            },
          });
        },
        onDragStart: () => setState({ type: 'is-dragging' }),
        onDrop: () => setState(idle),
      }),
      dropTargetForElements({
        element: outer,
        getData: getColData,
        canDrop: ({ source }) =>
          isDraggingACard({ source }) || isDraggingAColumn({ source }),
        getIsSticky: () => true,
        onDragStart({ source, location }) {
          if (isCardData(source.data))
            setIsCardOver({ data: source.data, location });
        },
        onDragEnter({ source, location }) {
          if (isCardData(source.data)) {
            setIsCardOver({ data: source.data, location });
            return;
          }
          if (
            isColumnData(source.data) &&
            source.data.column.id !== columnRef.current.id
          ) {
            setState({ type: 'is-column-over' });
          }
        },
        onDropTargetChange({ source, location }) {
          if (isCardData(source.data))
            setIsCardOver({ data: source.data, location });
        },
        onDragLeave({ source }) {
          if (
            isColumnData(source.data) &&
            source.data.column.id === columnRef.current.id
          )
            return;
          setState(idle);
        },
        onDrop: () => setState(idle),
      }),
      autoScrollForElements({
        element: scrollable,
        getConfiguration: () => scrollConfig,
        canScroll: canCardScroll,
      }),
      unsafeOverflowAutoScrollForElements({
        element: scrollable,
        getConfiguration: () => scrollConfig,
        canScroll: ({ source }) =>
          canCardScroll({ source }) && settings.isOverflowScrollingEnabled,
        getOverflow: () => ({
          fromTopEdge: { top: 1000, left: 1000, right: 1000 },
          forBottomEdge: { bottom: 1000 },
        }),
      }),
    );
  }, [settings]);

  return (
    <div
      className={cn('flex w-[290px] flex-shrink-0 flex-col select-none')}
      ref={outerFullHeightRef}
      data-testid="board-column"
      data-column-name={column.title}
    >
      <div
        className={cn(
          `flex max-h-[calc(100vh-11rem)] min-h-60 flex-col overflow-hidden rounded-2xl border border-line/80 bg-surface-active/60 text-gray-800 ${stateStyles[state.type]}`,
        )}
        ref={innerRef}
        {...{ [blockBoardPanningAttr]: true }}
      >
        <div
          className={`flex max-h-full min-h-0 flex-1 flex-col ${state.type === 'is-column-over' ? 'invisible' : ''}`}
        >
          {/* แถบสีประจำ column */}
          <div
            className="h-1 w-full flex-shrink-0"
            style={{ backgroundColor: column.color ?? '#94A3B8' }}
          />
          <div
            className="flex flex-row items-center gap-2 px-3 pt-2.5 pb-2"
            ref={headerRef}
          >
            <div className="text-sm font-semibold text-ink">{column.title}</div>
            <Badge
              variant="outline"
              className={cn(
                'rounded-full border-transparent px-1.75 py-0.25 text-xs font-semibold',
                column.wipLimit > 0 && column.totalTasks > column.wipLimit
                  ? 'bg-red-100/80 text-red-600'
                  : 'bg-white/80 text-ink-subtle',
              )}
            >
              {column.wipLimit > 0
                ? `${column.totalTasks}/${column.wipLimit}`
                : column.totalTasks}
            </Badge>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setAddingAt('top')}
              aria-label="Add a card to top"
              disabled={isLoading}
              className="flex size-6 cursor-pointer items-center justify-center rounded-md text-ink-faint hover:bg-white/80 hover:text-brand disabled:cursor-default disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
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
              'scrollbar-thin-y scrollbar-light flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto [overflow-anchor:none]'
            }
            ref={scrollableRef}
          >
            {isLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-25 w-full rounded-md" />
                ))}
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
                <span
                  className="tc-load"
                  style={
                    { '--tc-h': '18px', '--tc-w': '4px' } as React.CSSProperties
                  }
                >
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            {!isLoading &&
              column.cards.length === 0 &&
              state.type !== 'is-card-over' && (
                <div className="px-3 py-8 text-center text-xs font-medium text-ink-faint">
                  No tasks yet
                </div>
              )}
            {state.type === 'is-card-over' && !state.isOverChildCard && (
              <div className="flex-shrink-0 px-3 py-1">
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
            <div className="px-1.5 pt-1 pb-1.5">
              <button
                type="button"
                onClick={() => setAddingAt('bottom')}
                disabled={isLoading}
                className="flex w-full cursor-pointer flex-row items-center gap-1.75 rounded-lg p-2.5 text-left text-sm font-semibold text-ink-subtle hover:bg-white/80 hover:text-brand disabled:cursor-default disabled:opacity-50"
              >
                <Plus size={15} />
                Add a card
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

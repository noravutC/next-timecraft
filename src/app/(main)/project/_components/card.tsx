'use client';

import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import invariant from 'tiny-invariant';
import {
  getCardData,
  getCardDropTargetData,
  isCardData,
  isDraggingACard,
  TCard,
  TColumn,
} from './data';
import { isShallowEqual } from './is-shallow-equal';
import { isSafari } from './is-safari';
import { useShallow } from 'zustand/react/shallow';
import { useTaskStore } from '@/store/use-task.store';
import { useProjectStore } from '@/store/use-project.store';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { CalendarDays, MessageSquare } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { formatDateShort } from '@/helper/utils/date-format';
import { cn } from '@/lib/utils';
import { CardActionsMenu } from './card-actions-menu';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { withSettingsDefaults } from '@/types/project-settings';

type TCardState =
  | { type: 'idle' }
  | { type: 'is-dragging' }
  | { type: 'is-dragging-and-left-self' }
  | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge }
  | { type: 'preview'; container: HTMLElement; dragging: DOMRect };

const idle: TCardState = { type: 'idle' };

const innerStyles: Partial<Record<TCardState['type'], string>> = {
  idle: 'hover:border-[#D9D7F5] hover:shadow-[0_5px_16px_rgba(20,22,35,0.08)] hover:-translate-y-px cursor-pointer',
  'is-dragging': 'opacity-40',
};

const outerStyles: Partial<Record<TCardState['type'], string>> = {
  'is-dragging-and-left-self': 'hidden',
};

export function CardShadow({ dragging }: { dragging: DOMRect }) {
  return (
    <div
      className="flex-shrink-0 rounded-md bg-gray-200"
      style={{ height: dragging.height }}
    />
  );
}

export function CardDisplay({
  card,
  state,
  allColumns,
  outerRef,
  innerRef,
}: {
  card: TCard;
  state: TCardState;
  allColumns?: TColumn[];
  outerRef?: React.RefObject<HTMLDivElement | null>;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const tasksLoader = useTaskStore(useShallow((s) => s.tasksLoader));
  const isLoading = tasksLoader[card.id] ?? false;
  const openTask = useTaskDetailStore((s) => s.open);
  const commentCount = useTaskStore(
    useShallow((s) => s.tasks[card.id]?.commentCount ?? 0),
  );
  const projectSettings = useProjectStore(
    useShallow((s) =>
      s.projectIsUsing ? (s.projects[s.projectIsUsing]?.settings ?? null) : null,
    ),
  );
  const tagColors = withSettingsDefaults(projectSettings).tagColors;

  const firstTag = card.tags?.[0];
  const palette = firstTag
    ? paletteFor(tagColors[firstTag] ?? hashTagColor(firstTag))
    : null;
  const barColor = palette?.value ?? '#CBD5E1';

  return (
    <div
      ref={outerRef}
      className={cn(
        `flex flex-shrink-0 flex-col gap-2 px-3 py-1 ${outerStyles[state.type] ?? ''}`,
        isLoading && 'pointer-events-none',
      )}
    >
      {state.type === 'is-over' && state.closestEdge === 'top' && (
        <CardShadow dragging={state.dragging} />
      )}
      <div
        ref={innerRef}
        className={`group relative min-h-30 rounded-xl border border-[#ECEDF1] bg-white p-3.5 text-gray-700 shadow-[0_1px_2px_rgba(20,22,35,0.03)] transition-[box-shadow,border-color,transform] duration-150 ${innerStyles[state.type] ?? ''}`}
        style={
          state.type === 'preview'
            ? {
                width: state.dragging.width,
                height: state.dragging.height,
                transform: !isSafari() ? 'rotate(4deg)' : undefined,
              }
            : undefined
        }
      >
        <div
          className="mb-2.5 h-[5px] w-6.5 rounded-full"
          style={{ backgroundColor: barColor }}
        />

        <div className="flex items-start">
          <div
            className="line-clamp-3 flex-1 text-sm leading-tight font-semibold tracking-tight text-[#1D1E26]"
            onClick={(e) => {
              if (state.type !== 'idle') return;
              if ((e.target as HTMLElement).closest('[data-card-action]'))
                return;
              openTask(card.id);
            }}
          >
            {card.title}
          </div>
          {allColumns && (
            <div
              data-card-action
              className="absolute top-2.5 right-2"
            >
              <CardActionsMenu card={card} allColumns={allColumns} />
            </div>
          )}
        </div>

        {palette && firstTag && (
          <div
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: palette.bg, color: palette.text }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: barColor }}
            />
            {firstTag}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-medium text-[#8A8F9C]">
            <CalendarDays className="size-3.5" />
            {formatDateShort(card.createdAt)}
          </span>
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-[#8A8F9C]">
              <MessageSquare className="size-3.5" />
              {commentCount}
            </span>
          )}
          {isLoading && <Loader size="xs" />}
        </div>
      </div>
      {state.type === 'is-over' && state.closestEdge === 'bottom' && (
        <CardShadow dragging={state.dragging} />
      )}
    </div>
  );
}

export function Card({
  card,
  columnId,
  allColumns,
}: {
  card: TCard;
  columnId: string;
  allColumns: TColumn[];
}) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<TCardState>(idle);

  const tasksLoader = useTaskStore(useShallow((s) => s.tasksLoader));
  const isLoading = tasksLoader[card.id] ?? false;

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    invariant(outer && inner);

    if (isLoading) return;

    // ใช้ร่วมกันระหว่าง onDragEnter และ onDrag
    const updateIsOver = (
      source: { data: Record<string | symbol, unknown> },
      selfData: Record<string | symbol, unknown>,
    ) => {
      if (!isCardData(source.data) || source.data.card.id === card.id) return;
      const closestEdge = extractClosestEdge(selfData);
      if (!closestEdge) return;
      const proposed: TCardState = {
        type: 'is-over',
        dragging: source.data.rect,
        closestEdge,
      };
      setState((cur) => (isShallowEqual(proposed, cur) ? cur : proposed));
    };

    return combine(
      draggable({
        element: inner,
        getInitialData: ({ element }) =>
          getCardData({
            card,
            columnId,
            rect: element.getBoundingClientRect(),
          }),
        onGenerateDragPreview({ nativeSetDragImage, location, source }) {
          invariant(isCardData(source.data));
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element: inner,
              input: location.current.input,
            }),
            render({ container }) {
              setState({
                type: 'preview',
                container,
                dragging: inner.getBoundingClientRect(),
              });
            },
          });
        },
        onDragStart: () => setState({ type: 'is-dragging' }),
        onDrop: () => setState(idle),
      }),
      dropTargetForElements({
        element: outer,
        getIsSticky: () => true,
        canDrop: isDraggingACard,
        getData: ({ element, input }) =>
          attachClosestEdge(getCardDropTargetData({ card, columnId }), {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          }),
        onDragEnter: ({ source, self }) => updateIsOver(source, self.data),
        onDrag: ({ source, self }) => updateIsOver(source, self.data),
        onDragLeave({ source }) {
          if (isCardData(source.data) && source.data.card.id === card.id) {
            setState({ type: 'is-dragging-and-left-self' });
            return;
          }
          setState(idle);
        },
        onDrop: () => setState(idle),
      }),
    );
  }, [card, columnId, isLoading]);

  return (
    <>
      <CardDisplay
        outerRef={outerRef}
        innerRef={innerRef}
        state={state}
        card={card}
        allColumns={allColumns}
      />
      {state.type === 'preview' &&
        createPortal(
          <CardDisplay state={state} card={card} allColumns={allColumns} />,
          state.container,
        )}
    </>
  );
}

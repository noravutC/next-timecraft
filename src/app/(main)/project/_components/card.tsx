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
import { useAssigneeStore } from '@/store/use-assignee.store';
import { CalendarDays, Flag, MessageSquare } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';
import { Loader } from '@/components/ui/loader';
import { PRIORITY_STYLES } from '@/lib/task-priority';
import {
  daysUntil,
  formatDateShort,
  formatRelativeDay,
} from '@/helper/utils/date-format';
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

const NO_ASSIGNEES: never[] = [];
const MAX_VISIBLE_TAGS = 2;
const MAX_VISIBLE_ASSIGNEES = 3;

const innerStyles: Partial<Record<TCardState['type'], string>> = {
  idle: 'hover:border-brand-line hover:shadow-[0_5px_16px_rgba(20,22,35,0.08)] hover:-translate-y-px cursor-pointer',
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

  const assignees = useAssigneeStore(
    useShallow((s) => s.byTask[card.id]?.items ?? NO_ASSIGNEES),
  );

  const firstTag = card.tags?.[0];
  const palette = firstTag
    ? paletteFor(tagColors[firstTag] ?? hashTagColor(firstTag))
    : null;

  const dueDate = card.dueDate ? new Date(card.dueDate) : null;
  const dueInDays = dueDate ? daysUntil(dueDate) : null;
  // โชว์ธงเฉพาะ high — การ์ดต้องเหลือแต่สัญญาณที่สำคัญจริง
  const priorityStyle =
    card.priority === 'high' ? PRIORITY_STYLES.high : null;
  const hasMeta =
    !!dueDate || commentCount > 0 || assignees.length > 0 || isLoading;

  return (
    <div
      ref={outerRef}
      className={cn(
        `animate-in fade-in flex flex-shrink-0 flex-col gap-2 px-3 py-1 duration-200 ${outerStyles[state.type] ?? ''}`,
        isLoading && 'pointer-events-none',
      )}
      data-testid="board-card"
      data-card-title={card.title}
    >
      {state.type === 'is-over' && state.closestEdge === 'top' && (
        <CardShadow dragging={state.dragging} />
      )}
      <div
        ref={innerRef}
        className={`group relative rounded-xl border border-line bg-white p-3.5 text-gray-700 shadow-[0_1px_2px_rgba(20,22,35,0.03)] transition-[box-shadow,border-color,transform] duration-150 ${innerStyles[state.type] ?? ''}`}
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
        {palette && (
          <div
            className="mb-2.5 h-[5px] w-6.5 rounded-full"
            style={{ backgroundColor: palette.value }}
          />
        )}

        <div className="flex items-start">
          <div
            className="line-clamp-3 flex-1 text-sm leading-tight font-semibold tracking-tight text-ink"
            onClick={(e) => {
              if (state.type !== 'idle') return;
              if ((e.target as HTMLElement).closest('[data-card-action]'))
                return;
              openTask(card.id);
            }}
          >
            {priorityStyle && (
              <Flag
                className="mr-1.5 -mt-px inline size-3.5 align-middle"
                style={{ color: priorityStyle.text }}
                fill="currentColor"
                aria-label={`${priorityStyle.label} priority`}
              />
            )}
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

        {card.tags && card.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {card.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => {
              const p = paletteFor(tagColors[tag] ?? hashTagColor(tag));
              return (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: p.bg, color: p.text }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: p.value }}
                  />
                  {tag}
                </span>
              );
            })}
            {card.tags.length > MAX_VISIBLE_TAGS && (
              <span className="text-xs font-medium text-ink-faint">
                +{card.tags.length - MAX_VISIBLE_TAGS}
              </span>
            )}
          </div>
        )}

        {hasMeta && (
          <div className="mt-3 flex items-center gap-2.5">
            {dueDate && dueInDays !== null && (
              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  dueInDays < 0
                    ? 'text-red-500'
                    : dueInDays <= 2
                      ? 'text-amber-600'
                      : 'text-ink-subtle',
                )}
              >
                <CalendarDays className="size-3.5" />
                {Math.abs(dueInDays) <= 7
                  ? formatRelativeDay(dueDate)
                  : formatDateShort(dueDate)}
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-ink-subtle">
                <MessageSquare className="size-3.5" />
                {commentCount}
              </span>
            )}
            {isLoading && <Loader size="xs" />}
            {assignees.length > 0 && (
              <>
                <span className="flex-1" />
                <AvatarGroup className="-space-x-1.5">
                  {assignees.slice(0, MAX_VISIBLE_ASSIGNEES).map((a) => (
                    <Avatar key={a.userId} className="size-5">
                      <AvatarImage src={a.avatar ?? undefined} alt={a.fullName} />
                      <AvatarFallback className="text-xs font-semibold">
                        {a.fullName?.[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {assignees.length > MAX_VISIBLE_ASSIGNEES && (
                    <AvatarGroupCount className="size-5 text-xs">
                      +{assignees.length - MAX_VISIBLE_ASSIGNEES}
                    </AvatarGroupCount>
                  )}
                </AvatarGroup>
              </>
            )}
          </div>
        )}
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

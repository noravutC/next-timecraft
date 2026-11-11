'use client';

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { TCard, TColumn } from './data';
import { isSafari } from './is-safari';
import { useShallow } from 'zustand/react/shallow';
import { useTaskStore } from '@/store/use-task.store';
import { useProjectStore } from '@/store/use-project.store';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { useAssigneeStore } from '@/store/use-assignee.store';
import { Calendar, MessageSquare, SquareCheck } from 'lucide-react';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { useSubtaskStore } from '@/store/use-subtask.store';
import { Loader } from '@/components/ui/loader';
import {
  daysUntil,
  dueUrgency,
  formatDueLabel,
  type DueUrgency,
} from '@/helper/utils/date-format';
import { cn } from '@/lib/utils';
import { CardActionsMenu } from './card-actions-menu';
import { CardDoneTick, type CardDoneState } from './card-done-tick';
import { CardTagRow } from './card-tag-row';
import { useTaskBlocked } from '@/components/project/use-task-blocked';
import { useBoardAccess } from '@/components/project/use-board-access';
import { useUnreadStore } from '@/store/use-unread.store';
import { withSettingsDefaults } from '@/types/project-settings';
import { TCardState, useCardDnd } from './use-card-dnd';

const NO_ASSIGNEES: never[] = [];

const innerStyles: Partial<Record<TCardState['type'], string>> = {
  idle: 'cursor-pointer hover:border-line-strong hover:shadow-card-hover',
  'is-dragging': 'opacity-40',
  preview: 'border-line-strong shadow-card-drag',
};

const dueToneStyles: Record<DueUrgency, string> = {
  overdue: 'text-(--priority-high)',
  soon: 'text-warning',
  normal: 'text-ink-subtle',
};

const outerStyles: Partial<Record<TCardState['type'], string>> = {
  'is-dragging-and-left-self': 'hidden',
};

export function CardShadow({ dragging }: { dragging: DOMRect }) {
  return (
    <div
      className="flex-shrink-0 rounded-lg border border-dashed border-neutral-400 bg-brand/4"
      style={{ height: dragging.height }}
    />
  );
}

export function CardDisplay({
  card,
  state,
  allColumns,
  doneState,
  outerRef,
  innerRef,
}: {
  card: TCard;
  state: TCardState;
  allColumns?: TColumn[];
  doneState?: CardDoneState;
  outerRef?: React.RefObject<HTMLDivElement | null>;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const tasksLoader = useTaskStore(useShallow((s) => s.tasksLoader));
  const isLoading = tasksLoader[card.id] ?? false;
  const openTask = useTaskDetailStore((s) => s.open);
  const unread = useUnreadStore((s) => s.byTask[card.id] ?? 0);
  const commentCount = useTaskStore(
    useShallow((s) => s.tasks[card.id]?.commentCount ?? 0),
  );
  const projectSettings = useProjectStore(
    useShallow((s) =>
      s.projectIsUsing
        ? (s.projects[s.projectIsUsing]?.settings ?? null)
        : null,
    ),
  );
  const tagColors = withSettingsDefaults(projectSettings).tagColors;

  const assignees = useAssigneeStore(
    useShallow((s) => s.byTask[card.id]?.items ?? NO_ASSIGNEES),
  );
  const subtasks = useSubtaskStore(useShallow((s) => s.progressOf(card.id)));

  const tags = card.tags ?? [];
  const blocked = useTaskBlocked(card.id);
  const hasTagRow = tags.length > 0 || assignees.length > 0 || blocked;
  const dueDate = card.dueDate ? new Date(card.dueDate) : null;
  const dueInDays = dueDate ? daysUntil(dueDate) : null;

  return (
    <div
      ref={outerRef}
      className={cn(
        `flex flex-shrink-0 flex-col gap-2 px-2 py-0.5 ${outerStyles[state.type] ?? ''}`,
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
        className={`group relative flex flex-col gap-3 rounded-lg border border-line bg-background p-3 text-ink shadow-card transition-[box-shadow,border-color] duration-150 ${innerStyles[state.type] ?? ''}`}
        style={
          state.type === 'preview'
            ? {
                width: state.dragging.width,
                height: state.dragging.height,
                transform: !isSafari() ? 'rotate(2deg)' : undefined,
              }
            : undefined
        }
      >
        <div className="flex items-start gap-2">
          <div
            className={cn(
              'line-clamp-3 flex-1 text-base font-medium',
              doneState?.done && 'text-ink-muted',
            )}
            onClick={(e) => {
              if (state.type !== 'idle') return;
              if ((e.target as HTMLElement).closest('[data-card-action]'))
                return;
              openTask(card.id);
            }}
          >
            {card.title}
          </div>
          {/* ลอยทับมุมขวาบน — ไม่กินความกว้างของชื่อการ์ดตอนปกติ */}
          {allColumns && (
            <div data-card-action className="absolute top-2.5 right-2">
              <CardActionsMenu card={card} allColumns={allColumns} />
            </div>
          )}
        </div>

        {hasTagRow && (
          <CardTagRow
            tags={tags}
            tagColors={tagColors}
            assignees={assignees}
            blocked={blocked}
          />
        )}

        {/* แถว meta: ฟอนต์/ขนาด/ไอคอนเท่ากันทุกตัว — มีเส้นคั่นเมื่อมีแถว tag ด้านบน */}
        <div
          className={cn(
            'flex items-center gap-4 text-xs font-medium text-ink-subtle tabular-nums',
            hasTagRow && 'border-t border-line-soft pt-2.5',
          )}
        >
          <PriorityBars priority={card.priority ?? 'medium'} />
          {dueDate && dueInDays !== null && (
            <span
              className={cn(
                'flex items-center gap-1.25',
                dueToneStyles[dueUrgency(dueInDays)],
              )}
            >
              <Calendar className="size-3.5" />
              {formatDueLabel(dueDate)}
            </span>
          )}
          {subtasks && (
            <span className="flex items-center gap-1.25">
              <SquareCheck className="size-3.5" />
              {subtasks.done}/{subtasks.total}
              <span className="sr-only"> subtasks done</span>
            </span>
          )}
          {commentCount > 0 && (
            <span
              className={cn(
                'flex items-center gap-1.25',
                unread > 0 && 'text-brand-dark',
              )}
            >
              <MessageSquare className="size-3.5" />
              {commentCount}
              <span className="sr-only">
                {unread > 0
                  ? ` comments, ${unread} unread`
                  : commentCount === 1
                    ? ' comment'
                    : ' comments'}
              </span>
              {unread > 0 && (
                <span aria-hidden className="size-1.5 rounded-full bg-brand" />
              )}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            {isLoading && <Loader size="xs" />}
            {doneState && <CardDoneTick card={card} state={doneState} />}
          </span>
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

  const tasksLoader = useTaskStore(useShallow((s) => s.tasksLoader));
  const isLoading = tasksLoader[card.id] ?? false;
  const access = useBoardAccess();
  const state = useCardDnd({
    card,
    columnId,
    isLoading,
    canDrag: access.can('task:move'),
    outerRef,
    innerRef,
  });
  // read-only boards get no card menu (it only holds changes)
  const menuColumns = access.can('task:update') ? allColumns : undefined;
  const column = allColumns.find((c) => c.id === columnId);
  const doneState: CardDoneState = {
    done: column?.isDone ?? false,
    color: column?.color,
    canToggle: access.can('task:move') && allColumns.some((c) => c.isDone),
  };

  return (
    <>
      <CardDisplay
        outerRef={outerRef}
        innerRef={innerRef}
        state={state}
        card={card}
        allColumns={menuColumns}
        doneState={doneState}
      />
      {state.type === 'preview' &&
        createPortal(
          <CardDisplay
            state={state}
            card={card}
            allColumns={menuColumns}
            doneState={doneState}
          />,
          state.container,
        )}
    </>
  );
}

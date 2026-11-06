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
import { UserAvatar } from '@/components/people/user-avatar';
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
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
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { withSettingsDefaults } from '@/types/project-settings';
import { TCardState, useCardDnd } from './use-card-dnd';

const NO_ASSIGNEES: never[] = [];
const MAX_VISIBLE_TAGS = 2;
const MAX_VISIBLE_ASSIGNEES = 3;

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
  const hasTagRow = tags.length > 0 || assignees.length > 0;
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
            className="line-clamp-3 flex-1 text-base font-medium"
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
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-5.5 items-center gap-1.5 rounded-full border border-line px-2 text-xs text-ink-muted"
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor: paletteFor(
                        tagColors[tag] ?? hashTagColor(tag),
                      ).value,
                    }}
                  />
                  {tag}
                </span>
              ))}
              {tags.length > MAX_VISIBLE_TAGS && (
                <span className="text-xs text-ink-subtle">
                  +{tags.length - MAX_VISIBLE_TAGS}
                </span>
              )}
            </div>
            {assignees.length > 0 && (
              <AvatarGroup className="shrink-0">
                {assignees.slice(0, MAX_VISIBLE_ASSIGNEES).map((a) => (
                  <UserAvatar
                    key={a.userId}
                    name={a.fullName}
                    image={a.avatar}
                    seed={a.userId}
                    size="sm"
                    className="ring-2 ring-background"
                  />
                ))}
                {assignees.length > MAX_VISIBLE_ASSIGNEES && (
                  <AvatarGroupCount className="size-5.5 text-4xs">
                    +{assignees.length - MAX_VISIBLE_ASSIGNEES}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
            )}
          </div>
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
            <span
              className="flex items-center gap-1.25"
              aria-label={`${subtasks.done} of ${subtasks.total} subtasks done`}
            >
              <SquareCheck className="size-3.5" />
              {subtasks.done}/{subtasks.total}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1.25">
              <MessageSquare className="size-3.5" />
              {commentCount}
            </span>
          )}
          {isLoading && <Loader size="xs" className="ml-auto" />}
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
  const state = useCardDnd({ card, columnId, isLoading, outerRef, innerRef });

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

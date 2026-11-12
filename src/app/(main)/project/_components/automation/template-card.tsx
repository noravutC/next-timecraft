'use client';

import { Calendar, Repeat, SquareCheck } from 'lucide-react';
import { UserAvatar } from '@/components/people/user-avatar';
import { TagChip } from '@/components/task-detail/parts/tag-chip';
import { ColumnMark } from '@/components/task-meta/column-mark';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PRIORITY_STYLES } from '@/lib/task-priority';
import type { ProjectSettings } from '@/types/project-settings';
import type { BoardColumn, TemplateCardView } from './automation-operations';
import type { PeopleById } from './rule-parts';

/** One template: what a task made from it starts with, and how it is used. */
export const TemplateCard = ({
  card,
  people,
  tagColors,
  columns,
  canUse,
  onOpen,
  onUse,
}: {
  card: TemplateCardView;
  people: PeopleById;
  tagColors: Required<ProjectSettings>['tagColors'];
  columns: BoardColumn[];
  /** may create tasks on this board */
  canUse: boolean;
  onOpen: (templateId: string) => void;
  onUse: (templateId: string, columnId: string) => void;
}) => (
  <li className="flex flex-col gap-2.5 rounded-xl border border-line bg-background px-3.5 pt-3.5 pb-2.5">
    <div className="flex min-h-5.5 items-center gap-2">
      <Button
        variant="link"
        size={null}
        onClick={() => onOpen(card.id)}
        className="h-auto min-w-0 flex-1 justify-start p-0 text-base font-medium"
      >
        <span className="truncate">{card.title}</span>
      </Button>
      <span className="flex shrink-0 -space-x-1.5">
        {card.assigneeIds.slice(0, 3).map((id) => (
          <UserAvatar
            key={id}
            name={people[id]?.name}
            image={people[id]?.avatar}
            seed={id}
            size="sm"
            className="ring-2 ring-background"
          />
        ))}
      </span>
    </div>
    {card.labels.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {card.labels.map((label) => (
          <TagChip key={label} tag={label} tagColors={tagColors} size="sm" />
        ))}
      </div>
    )}
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-ink-subtle">
      <span className="inline-flex items-center gap-1.25">
        <PriorityBars priority={card.priority} decorative />
        {PRIORITY_STYLES[card.priority].label}
      </span>
      <span className="inline-flex items-center gap-1.25">
        <SquareCheck aria-hidden className="size-3.5" />
        {card.subtasks}
      </span>
      <span className="inline-flex items-center gap-1.25">
        <Calendar aria-hidden className="size-3.5" />
        {card.due}
      </span>
    </div>
    <div className="mt-auto flex items-center gap-2 border-t border-line-soft pt-2.5">
      <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-xs text-ink-subtle">
        {card.repeats && (
          <Repeat
            aria-hidden
            className="size-3.25 shrink-0 text-tone-blue-fg"
          />
        )}
        <span className="truncate">{card.usage}</span>
      </span>
      {canUse && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="xs"
              aria-label={`Use ${card.title}`}
            >
              Use
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-normal text-ink-subtle">
              Create a task in
            </DropdownMenuLabel>
            {columns.map((column) => (
              <DropdownMenuItem
                key={column.id}
                onSelect={() => onUse(card.id, column.id)}
              >
                <ColumnMark color={column.color} done={column.isDone} />
                <span className="truncate">{column.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  </li>
);

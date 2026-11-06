'use client';

import { Calendar, Tag, User } from 'lucide-react';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/people/user-avatar';
import { DUE_BUCKETS, DUE_BUCKET_LABELS } from '@/helper/utils/due-filter';
import { cn } from '@/lib/utils';
import {
  FilterCheckItem,
  FilterDropdown,
  FilterEmpty,
} from './board-filter-controls';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { PRIORITY_ORDER, PRIORITY_STYLES } from '@/lib/task-priority';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import type { BoardFilterBarState } from './use-board-filter-bar';

const Count = ({ value }: { value: number | undefined }) => (
  <span className="font-mono text-xs text-ink-subtle">{value ?? ''}</span>
);

/** High to low; the board view shows how many tasks each has. */
export const PriorityFilterMenu = ({
  filter,
  withCounts = false,
}: {
  filter: BoardFilterBarState;
  withCounts?: boolean;
}) => (
  <FilterDropdown
    icon={<PriorityBars priority="high" color="var(--ink-subtle)" decorative />}
    label="Priority"
    title="Filter by priority"
    activeCount={filter.priorities.length}
  >
    {[...PRIORITY_ORDER].reverse().map((priority) => (
      <FilterCheckItem
        key={priority}
        checked={filter.priorities.includes(priority)}
        onToggle={() => filter.togglePriority(priority)}
      >
        <PriorityBars priority={priority} decorative />
        <span className="flex-1">{PRIORITY_STYLES[priority].label}</span>
        {withCounts && <Count value={filter.priorityCounts[priority] ?? 0} />}
      </FilterCheckItem>
    ))}
  </FilterDropdown>
);

/** The board's labels, each with its color. */
export const LabelFilterMenu = ({
  filter,
}: {
  filter: BoardFilterBarState;
}) => (
  <FilterDropdown
    icon={<Tag className="size-3.5" />}
    label="Labels"
    title="Filter by label"
    activeCount={filter.tags.length}
  >
    {filter.tagOptions.length === 0 && (
      <FilterEmpty>No labels on this board yet</FilterEmpty>
    )}
    {filter.tagOptions.map((tag) => (
      <FilterCheckItem
        key={tag}
        checked={filter.tags.includes(tag)}
        onToggle={() => filter.toggleTag(tag)}
      >
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{
            backgroundColor: paletteFor(
              filter.tagColors[tag] ?? hashTagColor(tag),
            ).value,
          }}
        />
        {tag}
      </FilterCheckItem>
    ))}
  </FilterDropdown>
);

/** Overdue, this week, later, no date; counted when the menu opens. */
export const DueFilterMenu = ({ filter }: { filter: BoardFilterBarState }) => (
  <FilterDropdown
    icon={<Calendar className="size-3.5" />}
    label="Due date"
    title="Filter by due date"
    activeCount={filter.due.length}
    onOpen={filter.refreshCounts}
  >
    {DUE_BUCKETS.map((bucket) => (
      <FilterCheckItem
        key={bucket}
        checked={filter.due.includes(bucket)}
        onToggle={() => filter.toggleDue(bucket)}
      >
        <span
          className={cn(
            'flex-1',
            bucket === 'overdue' && 'text-(--priority-high)',
          )}
        >
          {DUE_BUCKET_LABELS[bucket]}
        </span>
        <Count value={filter.counts?.due[bucket]} />
      </FilterCheckItem>
    ))}
  </FilterDropdown>
);

/** Assigned to me first, then the other members, then nobody. */
export const AssigneeFilterMenu = ({
  filter,
}: {
  filter: BoardFilterBarState;
}) => (
  <FilterDropdown
    icon={<User className="size-3.5" />}
    label="Assignee"
    title="Filter by assignee"
    activeCount={
      filter.assigneeIds.length +
      Number(filter.mine) +
      Number(filter.unassigned)
    }
    onOpen={filter.refreshCounts}
  >
    {filter.me && (
      <>
        <FilterCheckItem checked={filter.mine} onToggle={filter.toggleMine}>
          <span className="flex-1">Assigned to me</span>
          <Count value={filter.counts?.mine} />
        </FilterCheckItem>
        <DropdownMenuSeparator />
      </>
    )}
    {filter.otherMemberIds.map((userId) => {
      const user = filter.users[userId];
      return (
        <FilterCheckItem
          key={userId}
          checked={filter.assigneeIds.includes(userId)}
          onToggle={() => filter.toggleAssignee(userId)}
        >
          <UserAvatar
            name={user?.fullName}
            image={user?.avatar}
            seed={userId}
            size="xs"
          />
          <span className="truncate">{user?.fullName ?? 'Unknown member'}</span>
        </FilterCheckItem>
      );
    })}
    <FilterCheckItem
      checked={filter.unassigned}
      onToggle={filter.toggleUnassigned}
    >
      No assignee
    </FilterCheckItem>
  </FilterDropdown>
);

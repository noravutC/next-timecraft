'use client';

import { Calendar, User } from 'lucide-react';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/people/user-avatar';
import { DUE_BUCKETS, DUE_BUCKET_LABELS } from '@/helper/utils/due-filter';
import { cn } from '@/lib/utils';
import { FilterCheckItem, FilterDropdown } from './board-filter-controls';
import type { BoardFilterBarState } from './use-board-filter-bar';

const Count = ({ value }: { value: number | undefined }) => (
  <span className="font-mono text-xs text-ink-subtle">{value ?? ''}</span>
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

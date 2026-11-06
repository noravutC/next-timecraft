'use client';

import { Button } from '@/components/ui/button';
import { DUE_BUCKET_LABELS } from '@/helper/utils/due-filter';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { PRIORITY_STYLES } from '@/lib/task-priority';
import { FilterChip } from './board-filter-controls';
import type { BoardFilterBarState } from './use-board-filter-bar';

/** The row under the toolbar while filtering: Showing X of Y, chips, Clear all. */
export const BoardFilterChips = ({
  filter,
}: {
  filter: BoardFilterBarState;
}) => {
  const search = filter.draft.trim();
  const memberName = (userId: string) =>
    filter.users[userId]?.fullName ?? 'Unknown member';

  return (
    <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-background px-5 py-1.5">
      <span className="text-xs text-ink-subtle">
        {filter.totalCount === null
          ? `Showing ${filter.shownCount}`
          : `Showing ${filter.shownCount} of ${filter.totalCount}`}
      </span>
      {search && (
        <FilterChip
          label={`Search: ${search}`}
          onRemove={() => filter.setDraft('')}
        />
      )}
      {filter.priorities.map((priority) => (
        <FilterChip
          key={priority}
          label={`Priority: ${PRIORITY_STYLES[priority].label}`}
          onRemove={() => filter.togglePriority(priority)}
        />
      ))}
      {filter.due.map((bucket) => (
        <FilterChip
          key={bucket}
          label={DUE_BUCKET_LABELS[bucket]}
          onRemove={() => filter.toggleDue(bucket)}
        />
      ))}
      {filter.tags.map((tag) => (
        <FilterChip
          key={tag}
          label={`Label: ${tag}`}
          dotColor={
            paletteFor(filter.tagColors[tag] ?? hashTagColor(tag)).value
          }
          onRemove={() => filter.toggleTag(tag)}
        />
      ))}
      {filter.mine && (
        <FilterChip label="Assigned to me" onRemove={filter.toggleMine} />
      )}
      {filter.assigneeIds.map((userId) => (
        <FilterChip
          key={userId}
          label={`Assignee: ${memberName(userId)}`}
          onRemove={() => filter.toggleAssignee(userId)}
        />
      ))}
      {filter.unassigned && (
        <FilterChip label="No assignee" onRemove={filter.toggleUnassigned} />
      )}
      <Button
        variant="ghost"
        size="xs"
        onClick={() => {
          filter.setDraft('');
          filter.clear();
        }}
        className="h-6.5 px-2 text-ink-muted underline underline-offset-3 hover:bg-transparent hover:text-ink"
      >
        Clear all
      </Button>
    </div>
  );
};

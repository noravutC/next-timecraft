'use client';

import { Plus, Search, Settings2, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/people/user-avatar';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { PRIORITY_ORDER, PRIORITY_STYLES } from '@/lib/task-priority';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { useNavStore } from '@/store';
import {
  FilterCheckItem,
  FilterChip,
  FilterDropdown,
  FilterEmpty,
} from './board-filter-controls';
import { useBoardFilterBar } from './use-board-filter-bar';
import { AiBreakdown } from './ai-breakdown';
import type { TColumn } from './data';

// แถบเครื่องมือของบอร์ด: ซ้าย = ค้นหา + ตัวกรอง, ขวา = AI / ตั้งค่า / New task
// แถวล่าง (เมื่อมี filter) = Showing X of Y + chips ของค่าที่เลือกไว้ + Clear all
export function BoardFilterBar({ columns }: { columns: TColumn[] }) {
  const {
    draft,
    setDraft,
    priorities,
    tags,
    assigneeIds,
    togglePriority,
    toggleTag,
    toggleAssignee,
    clear,
    tagColors,
    users,
    memberIds,
    tagOptions,
    activeCount,
    shownCount,
    totalCount,
    priorityCounts,
  } = useBoardFilterBar(columns);
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);
  const requestNewTask = useNavStore((s) => s.requestNewTask);
  const search = draft.trim();

  return (
    <>
      <div className="flex h-13 shrink-0 items-center gap-2 border-b border-line bg-background px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.75 -translate-y-1/2 text-ink-subtle" />
          <Input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="w-65 border-line pl-8"
            data-testid="board-filter-search"
          />
        </div>

        <FilterDropdown
          icon={
            <PriorityBars
              priority="high"
              color="var(--ink-subtle)"
              decorative
            />
          }
          label="Priority"
          title="Filter by priority"
          activeCount={priorities.length}
        >
          {[...PRIORITY_ORDER].reverse().map((priority) => (
            <FilterCheckItem
              key={priority}
              checked={priorities.includes(priority)}
              onToggle={() => togglePriority(priority)}
            >
              <PriorityBars priority={priority} decorative />
              <span className="flex-1">{PRIORITY_STYLES[priority].label}</span>
              <span className="font-mono text-xs text-ink-subtle">
                {priorityCounts[priority] ?? 0}
              </span>
            </FilterCheckItem>
          ))}
        </FilterDropdown>

        <FilterDropdown
          icon={<Tag className="size-3.5" />}
          label="Labels"
          title="Filter by label"
          activeCount={tags.length}
        >
          {tagOptions.length === 0 && (
            <FilterEmpty>No labels on this board yet</FilterEmpty>
          )}
          {tagOptions.map((tag) => (
            <FilterCheckItem
              key={tag}
              checked={tags.includes(tag)}
              onToggle={() => toggleTag(tag)}
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: paletteFor(
                    tagColors[tag] ?? hashTagColor(tag),
                  ).value,
                }}
              />
              {tag}
            </FilterCheckItem>
          ))}
        </FilterDropdown>

        <FilterDropdown
          icon={<User className="size-3.5" />}
          label="Assignee"
          title="Filter by assignee"
          activeCount={assigneeIds.length}
        >
          {memberIds.map((userId) => {
            const user = users[userId];
            return (
              <FilterCheckItem
                key={userId}
                checked={assigneeIds.includes(userId)}
                onToggle={() => toggleAssignee(userId)}
              >
                <UserAvatar
                  name={user?.fullName}
                  image={user?.avatar}
                  seed={userId}
                  size="xs"
                />
                <span className="truncate">
                  {user?.fullName ?? 'Unknown member'}
                </span>
              </FilterCheckItem>
            );
          })}
        </FilterDropdown>

        <div className="flex-1" />

        <AiBreakdown columns={columns} />
        <Button
          variant="outline"
          size="icon"
          className="border-line text-ink-muted"
          aria-label="Board settings"
          onClick={() => setBoardDialog('settings')}
        >
          <Settings2 className="size-3.75" />
        </Button>
        <Button size="sm" onClick={requestNewTask} disabled={!columns.length}>
          <Plus className="size-3.75 stroke-2" />
          New task
        </Button>
      </div>

      {activeCount > 0 && (
        <div className="flex h-11 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-background px-5">
          <span className="text-xs text-ink-subtle">
            {totalCount === null
              ? `Showing ${shownCount}`
              : `Showing ${shownCount} of ${totalCount}`}
          </span>
          {search && (
            <FilterChip
              label={`Search: ${search}`}
              onRemove={() => setDraft('')}
            />
          )}
          {priorities.map((priority) => (
            <FilterChip
              key={priority}
              label={`Priority: ${PRIORITY_STYLES[priority].label}`}
              onRemove={() => togglePriority(priority)}
            />
          ))}
          {tags.map((tag) => (
            <FilterChip
              key={tag}
              label={`Label: ${tag}`}
              dotColor={paletteFor(tagColors[tag] ?? hashTagColor(tag)).value}
              onRemove={() => toggleTag(tag)}
            />
          ))}
          {assigneeIds.map((userId) => (
            <FilterChip
              key={userId}
              label={`Assignee: ${users[userId]?.fullName ?? 'Unknown member'}`}
              onRemove={() => toggleAssignee(userId)}
            />
          ))}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setDraft('');
              clear();
            }}
            className="h-6.5 px-2 text-ink-muted underline underline-offset-3 hover:bg-transparent hover:text-ink"
          >
            Clear all
          </Button>
        </div>
      )}
    </>
  );
}

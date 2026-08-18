'use client';

import { Search, SlidersHorizontal, Tag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TagChip } from '@/components/task-detail/parts/tag-chip';
import { PRIORITY_ORDER, PRIORITY_STYLES } from '@/lib/task-priority';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import {
  FilterCheckItem,
  FilterChip,
  FilterDropdown,
} from './board-filter-controls';
import { useBoardFilterBar } from './use-board-filter-bar';

// แถบ filter เป็น section ขาวคั่นระหว่าง header กับบอร์ด (border-b เดียวกับ header)
// แถวบน = controls, แถวล่าง = chips ของค่าที่เลือกไว้ + Clear all
export function BoardFilterBar() {
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
  } = useBoardFilterBar();

  return (
    <div className="border-b bg-background px-5 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            inputSize="sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search tasks…"
            className="w-64 rounded-md border-line bg-surface pl-8 text-sm shadow-none placeholder:text-ink-faint focus-visible:bg-white"
            data-testid="board-filter-search"
          />
        </div>

        <FilterDropdown
          icon={SlidersHorizontal}
          label="Priority"
          activeCount={priorities.length}
        >
          {PRIORITY_ORDER.map((priority) => (
            <FilterCheckItem
              key={priority}
              checked={priorities.includes(priority)}
              onToggle={() => togglePriority(priority)}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: PRIORITY_STYLES[priority].dot }}
              />
              {PRIORITY_STYLES[priority].label}
            </FilterCheckItem>
          ))}
        </FilterDropdown>

        <FilterDropdown
          icon={Tag}
          label="Tags"
          activeCount={tags.length}
          disabled={tagOptions.length === 0}
        >
          {tagOptions.map((tag) => {
            const palette = paletteFor(tagColors[tag] ?? hashTagColor(tag));
            return (
              <FilterCheckItem
                key={tag}
                checked={tags.includes(tag)}
                onToggle={() => toggleTag(tag)}
              >
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: palette.bg, color: palette.text }}
                >
                  {tag}
                </span>
              </FilterCheckItem>
            );
          })}
        </FilterDropdown>

        <FilterDropdown
          icon={Users}
          label="Assignee"
          activeCount={assigneeIds.length}
          disabled={memberIds.length === 0}
        >
          {memberIds.map((userId) => {
            const user = users[userId];
            return (
              <FilterCheckItem
                key={userId}
                checked={assigneeIds.includes(userId)}
                onToggle={() => toggleAssignee(userId)}
              >
                <Avatar className="size-5">
                  <AvatarImage src={user?.avatar ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(user?.fullName ?? '?').slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                {user?.fullName ?? 'Unknown member'}
              </FilterCheckItem>
            );
          })}
        </FilterDropdown>
      </div>

      {activeCount > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-ink-subtle">
            Filters
          </span>
          {priorities.map((priority) => {
            const style = PRIORITY_STYLES[priority];
            return (
              <FilterChip
                key={priority}
                label={style.label}
                palette={style}
                dotColor={style.dot}
                onRemove={() => togglePriority(priority)}
              />
            );
          })}
          {tags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              tagColors={tagColors}
              size="sm"
              onRemove={() => toggleTag(tag)}
            />
          ))}
          {assigneeIds.map((userId) => (
            <FilterChip
              key={userId}
              label={users[userId]?.fullName ?? 'Unknown member'}
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
            className="text-xs font-medium text-ink-subtle hover:text-ink"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

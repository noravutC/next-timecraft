'use client';

import {
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Tag,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { PRIORITY_ORDER, PRIORITY_STYLES } from '@/lib/task-priority';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { useNavStore } from '@/store';
import {
  FilterCheckItem,
  FilterChip,
  FilterDropdown,
} from './board-filter-controls';
import { useBoardFilterBar } from './use-board-filter-bar';
import { AiBreakdown } from './ai-breakdown';
import type { BoardColumnLike } from './use-ai-breakdown';

// แถบเครื่องมือของบอร์ด: ซ้าย = ค้นหา + ตัวกรอง, ขวา = AI / ตั้งค่า / New task
// แถวล่าง (เมื่อมี filter) = chips ของค่าที่เลือกไว้ + Clear all
export function BoardFilterBar({ columns }: { columns: BoardColumnLike[] }) {
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
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);
  const requestNewTask = useNavStore((s) => s.requestNewTask);

  return (
    <div className="border-b bg-background">
      <div className="flex min-h-13 flex-wrap items-center gap-2 px-5 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-subtle" />
          <Input
            inputSize="sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="w-64 border-line pl-8 text-sm"
            data-testid="board-filter-search"
          />
        </div>

        <FilterDropdown
          icon={SlidersHorizontal}
          label="Priority"
          activeCount={priorities.length}
        >
          {[...PRIORITY_ORDER].reverse().map((priority) => (
            <FilterCheckItem
              key={priority}
              checked={priorities.includes(priority)}
              onToggle={() => togglePriority(priority)}
            >
              <PriorityBars priority={priority} />
              {PRIORITY_STYLES[priority].label}
            </FilterCheckItem>
          ))}
        </FilterDropdown>

        <FilterDropdown
          icon={Tag}
          label="Labels"
          activeCount={tags.length}
          disabled={tagOptions.length === 0}
        >
          {tagOptions.map((tag) => (
            <FilterCheckItem
              key={tag}
              checked={tags.includes(tag)}
              onToggle={() => toggleTag(tag)}
            >
              <span
                className="size-2 shrink-0 rounded-full"
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

        <div className="flex-1" />

        <AiBreakdown columns={columns} />
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Board settings"
          onClick={() => setBoardDialog('settings')}
        >
          <Settings2 className="size-4" />
        </Button>
        <Button size="sm" onClick={requestNewTask} disabled={!columns.length}>
          <Plus className="size-4" />
          New task
        </Button>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-5 py-2">
          <span className="mr-1 text-xs text-ink-subtle">Filters</span>
          {priorities.map((priority) => (
            <FilterChip
              key={priority}
              label={`Priority: ${PRIORITY_STYLES[priority].label}`}
              dotColor={PRIORITY_STYLES[priority].dot}
              onRemove={() => togglePriority(priority)}
            />
          ))}
          {tags.map((tag) => (
            <FilterChip
              key={tag}
              label={tag}
              dotColor={paletteFor(tagColors[tag] ?? hashTagColor(tag)).value}
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
            className="text-ink-muted underline underline-offset-3 hover:text-ink"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

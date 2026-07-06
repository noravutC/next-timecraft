'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useBoardFilterStore } from '@/store/use-board-filter.store';
import { useProjectStore } from '@/store/use-project.store';
import { useTaskStore } from '@/store/use-task.store';
import { useUserStore } from '@/store/use-user.store';
import type { TaskPriority } from '@/types';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

// ทุก control สูง h-10 / rounded-xl / border-line/80 / bg-white เท่ากันหมด
// เพื่อให้กลืนกับการ์ดขาวบน bg-surface ของบอร์ด
const FilterDropdown = ({
  icon: Icon,
  label,
  activeCount,
  disabled,
  children,
}: {
  icon: typeof SlidersHorizontal;
  label: string;
  activeCount: number;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild disabled={disabled}>
      <Button
        variant="ghost"
        className={cn(
          'h-10 gap-1.5 rounded-xl border border-line/80 bg-white px-3.5 text-sm font-medium text-ink-muted hover:bg-white hover:text-ink',
          activeCount > 0 &&
            'border-brand-line bg-brand-soft/60 text-brand hover:bg-brand-soft/60 hover:text-brand',
        )}
      >
        <Icon className="size-4" />
        {label}
        {activeCount > 0 ? (
          <span className="rounded-full bg-white px-1.5 text-xs font-semibold text-brand">
            {activeCount}
          </span>
        ) : (
          <ChevronDown className="size-3.5 text-ink-faint" />
        )}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

export function BoardFilterBar() {
  const q = useBoardFilterStore((s) => s.q);
  const priorities = useBoardFilterStore((s) => s.priorities);
  const tags = useBoardFilterStore((s) => s.tags);
  const assigneeIds = useBoardFilterStore((s) => s.assigneeIds);
  const setQ = useBoardFilterStore((s) => s.setQ);
  const togglePriority = useBoardFilterStore((s) => s.togglePriority);
  const toggleTag = useBoardFilterStore((s) => s.toggleTag);
  const toggleAssignee = useBoardFilterStore((s) => s.toggleAssignee);
  const clear = useBoardFilterStore((s) => s.clear);

  // debounce ช่อง search — ยิง refetch เมื่อหยุดพิมพ์ 300ms
  const [draft, setDraft] = useState(q);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== q) setQ(draft);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, q, setQ]);

  const project = useProjectStore((s) => s.viewProjectUsing());
  const users = useUserStore(useShallow((s) => s.users));
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const tasksMap = useTaskStore(useShallow((s) => s.tasks));

  const memberIds = useMemo(
    () => (project?.members ?? []).map((m) => m.userId),
    [project?.members],
  );
  useEffect(() => {
    if (memberIds.length) void fetchUsers(memberIds);
  }, [memberIds, fetchUsers]);

  // ตัวเลือก tag = tags ของ project + tags ที่พบใน task ที่โหลดแล้ว
  const tagOptions = useMemo(() => {
    const all = new Set<string>(project?.tags ?? []);
    for (const task of Object.values(tasksMap)) {
      task.tags?.forEach((tag) => all.add(tag));
    }
    return [...all].sort();
  }, [project?.tags, tasksMap]);

  const activeCount =
    priorities.length + tags.length + assigneeIds.length + (q.trim() ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-line/60 bg-white/50 px-5 py-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search tasks…"
          className="h-10 w-72 rounded-xl border-line/80 bg-white pl-9 text-sm shadow-none placeholder:text-ink-faint"
          data-testid="board-filter-search"
        />
      </div>

      <FilterDropdown
        icon={SlidersHorizontal}
        label="Priority"
        activeCount={priorities.length}
      >
        {PRIORITIES.map((priority) => (
          <DropdownMenuCheckboxItem
            key={priority}
            checked={priorities.includes(priority)}
            onCheckedChange={() => togglePriority(priority)}
            className="capitalize"
          >
            {priority}
          </DropdownMenuCheckboxItem>
        ))}
      </FilterDropdown>

      <FilterDropdown
        icon={Tag}
        label="Tags"
        activeCount={tags.length}
        disabled={tagOptions.length === 0}
      >
        {tagOptions.map((tag) => (
          <DropdownMenuCheckboxItem
            key={tag}
            checked={tags.includes(tag)}
            onCheckedChange={() => toggleTag(tag)}
          >
            {tag}
          </DropdownMenuCheckboxItem>
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
            <DropdownMenuCheckboxItem
              key={userId}
              checked={assigneeIds.includes(userId)}
              onCheckedChange={() => toggleAssignee(userId)}
            >
              <Avatar className="size-5">
                <AvatarImage src={user?.avatar ?? undefined} />
                <AvatarFallback className="text-xs">
                  {(user?.fullName ?? '?').slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              {user?.fullName ?? 'Unknown member'}
            </DropdownMenuCheckboxItem>
          );
        })}
      </FilterDropdown>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          onClick={() => {
            setDraft('');
            clear();
          }}
          className="h-10 gap-1 rounded-xl px-3 text-sm font-medium text-ink-subtle hover:text-ink"
        >
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

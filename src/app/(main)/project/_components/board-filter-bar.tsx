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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TagChip } from '@/components/task-detail/parts/tag-chip';
import { cn } from '@/lib/utils';
import { PRIORITY_ORDER, PRIORITY_STYLES } from '@/lib/task-priority';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { withSettingsDefaults } from '@/types/project-settings';
import { useBoardFilterStore } from '@/store/use-board-filter.store';
import { useProjectStore } from '@/store/use-project.store';
import { useTaskStore } from '@/store/use-task.store';
import { useUserStore } from '@/store/use-user.store';

// แถบ filter เป็น section ขาวคั่นระหว่าง header กับบอร์ด (border-b เดียวกับ header)
// แถวบน = controls, แถวล่าง = chips ของค่าที่เลือกไว้ + Clear all
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
        size="sm"
        className={cn(
          'gap-1.5 rounded-md border border-line bg-white px-2.5 text-sm font-medium text-ink-muted hover:bg-surface-hover hover:text-ink',
          activeCount > 0 &&
            'border-brand-line bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand',
        )}
      >
        <Icon className="size-3.5" />
        {label}
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown className="size-3 opacity-60" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

// item ติ๊กเลือกใน dropdown — ใช้ Checkbox สี่เหลี่ยมแทน check mark ของ
// DropdownMenuCheckboxItem; preventDefault กันเมนูปิดตอนเลือกหลายค่า
const FilterCheckItem = ({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <DropdownMenuItem
    onSelect={(e) => {
      e.preventDefault();
      onToggle();
    }}
    className="gap-2.5"
  >
    <Checkbox
      checked={checked}
      tabIndex={-1}
      // important จำเป็น — DropdownMenuItem บังคับ svg ลูกเป็น text-muted-foreground
      className="pointer-events-none data-[state=checked]:border-brand data-[state=checked]:bg-brand [&_svg]:!text-white"
    />
    {children}
  </DropdownMenuItem>
);

// chip ของค่า filter ที่เลือกแล้ว — ขนาด/ทรงเดียวกับ TagChip size="sm"
const FilterChip = ({
  label,
  palette,
  dotColor,
  onRemove,
}: {
  label: string;
  palette?: { bg: string; border: string; text: string };
  dotColor?: string;
  onRemove: () => void;
}) => (
  <span
    className={cn(
      'inline-flex h-7 items-center gap-2 rounded-full border px-3 text-xs font-semibold',
      !palette && 'border-line bg-surface text-ink-muted',
    )}
    style={
      palette
        ? {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            color: palette.text,
          }
        : undefined
    }
  >
    <span
      className={cn(
        'size-2 shrink-0 rounded-full',
        !dotColor && 'bg-ink-faint',
      )}
      style={dotColor ? { backgroundColor: dotColor } : undefined}
    />
    {label}
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label}`}
      className="ml-0.5 flex size-4 cursor-pointer items-center justify-center rounded-full bg-black/10 transition-colors hover:bg-black/20"
    >
      <X className="size-2.5" />
    </button>
  </span>
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
  const projectSettings = useProjectStore(
    useShallow((s) =>
      s.projectIsUsing
        ? (s.projects[s.projectIsUsing]?.settings ?? null)
        : null,
    ),
  );
  const tagColors = withSettingsDefaults(projectSettings).tagColors;
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

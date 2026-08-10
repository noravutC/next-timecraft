import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { withSettingsDefaults } from '@/types/project-settings';
import { useBoardFilterStore } from '@/store/use-board-filter.store';
import { useProjectStore } from '@/store/use-project.store';
import { useTaskStore } from '@/store/use-task.store';
import { useUserStore } from '@/store/use-user.store';

/**
 * State + derivations ของ BoardFilterBar:
 * debounce ช่อง search, รวมตัวเลือก tag/สมาชิก, นับ filter ที่เปิดอยู่
 */
export function useBoardFilterBar() {
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

  return {
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
  };
}

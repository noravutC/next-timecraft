import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSession } from 'next-auth/react';
import { withSettingsDefaults } from '@/types/project-settings';
import { useBoardFilterStore } from '@/store/use-board-filter.store';
import { useProjectStore } from '@/store/use-project.store';
import { useTaskStore } from '@/store/use-task.store';
import { useUserStore } from '@/store/use-user.store';
import { sumPriorityCounts } from '@/helper/utils/task-filter';
import { countBoardTasks } from './board-operations';
import { useFilterCounts } from './use-filter-counts';
import type { TColumn } from './data';

/**
 * State + derivations ของ BoardFilterBar:
 * debounce ช่อง search, รวมตัวเลือก tag/สมาชิก, นับ filter ที่เปิดอยู่,
 * จำนวน task ที่แสดง (Showing X of Y)
 */
export function useBoardFilterBar(columns: TColumn[]) {
  const q = useBoardFilterStore((s) => s.q);
  const priorities = useBoardFilterStore((s) => s.priorities);
  const tags = useBoardFilterStore((s) => s.tags);
  const assigneeIds = useBoardFilterStore((s) => s.assigneeIds);
  const mine = useBoardFilterStore((s) => s.mine);
  const unassigned = useBoardFilterStore((s) => s.unassigned);
  const due = useBoardFilterStore((s) => s.due);
  const setQ = useBoardFilterStore((s) => s.setQ);
  const togglePriority = useBoardFilterStore((s) => s.togglePriority);
  const toggleTag = useBoardFilterStore((s) => s.toggleTag);
  const toggleAssignee = useBoardFilterStore((s) => s.toggleAssignee);
  const toggleMine = useBoardFilterStore((s) => s.toggleMine);
  const toggleUnassigned = useBoardFilterStore((s) => s.toggleUnassigned);
  const toggleDue = useBoardFilterStore((s) => s.toggleDue);
  const clear = useBoardFilterStore((s) => s.clear);
  const me = useSession().data?.user?.id ?? null;
  const { counts, refresh: refreshCounts } = useFilterCounts(
    columns.map((c) => c.id),
  );

  // debounce ช่อง search — ยิง refetch เมื่อหยุดพิมพ์ 300ms
  const [draft, setDraft] = useState(q);
  // q changed outside the field (a link's filter, Clear all): show it
  const [shownQ, setShownQ] = useState(q);
  if (q !== shownQ) {
    setShownQ(q);
    setDraft(q);
  }
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
  const priorityCounts = useTaskStore(
    useShallow((s) =>
      sumPriorityCounts(
        s.priorityCounts,
        columns.map((c) => c.id),
      ),
    ),
  );

  const memberIds = useMemo(
    () => (project?.members ?? []).map((m) => m.userId),
    [project?.members],
  );
  // you are "Assigned to me" at the top of the menu, not one of the list
  const otherMemberIds = useMemo(
    () => memberIds.filter((id) => id !== me),
    [memberIds, me],
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
    priorities.length +
    tags.length +
    assigneeIds.length +
    due.length +
    Number(mine) +
    Number(unassigned) +
    (q.trim() ? 1 : 0);

  // ยอดที่แสดง = totals จาก server (ผ่าน filter แล้ว); จำยอดตอนไม่มี filter
  // ไว้เป็นตัวหาร "of Y" — ปรับ state ระหว่าง render แทน useEffect
  const shownCount = countBoardTasks(columns);
  const [totalCount, setTotalCount] = useState<number | null>(
    activeCount === 0 ? shownCount : null,
  );
  if (activeCount === 0 && totalCount !== shownCount) {
    setTotalCount(shownCount);
  }

  return {
    draft,
    setDraft,
    priorities,
    tags,
    assigneeIds,
    mine,
    unassigned,
    due,
    togglePriority,
    toggleTag,
    toggleAssignee,
    toggleMine,
    toggleUnassigned,
    toggleDue,
    clear,
    tagColors,
    users,
    me,
    otherMemberIds,
    counts,
    refreshCounts,
    tagOptions,
    activeCount,
    shownCount,
    totalCount,
    priorityCounts,
  };
}

export type BoardFilterBarState = ReturnType<typeof useBoardFilterBar>;

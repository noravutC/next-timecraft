import { create } from 'zustand';
import type {
  BoardFilterState,
  DueBucket,
  TaskFilter,
  TaskPriority,
} from '@/types';
import { isTaskFilterActive } from '@/helper/utils/task-filter';
import { dueBounds } from '@/helper/utils/due-filter';
import { EMPTY_BOARD_FILTER } from '@/helper/utils/filter-url';

// UI state ของ filter บนบอร์ด — ไม่มี service; task store อ่าน payload ตอน fetch
type BoardFilterStore = BoardFilterState & {
  setQ: (q: string) => void;
  togglePriority: (priority: TaskPriority) => void;
  toggleTag: (tag: string) => void;
  toggleAssignee: (userId: string) => void;
  toggleMine: () => void;
  toggleUnassigned: () => void;
  toggleDue: (bucket: DueBucket) => void;
  /** the filter a board link carried */
  replace: (filter: BoardFilterState) => void;
  clear: () => void;
  /** payload สำหรับ API — undefined เมื่อไม่มีเงื่อนไขไหนเปิดอยู่ */
  toFilterPayload: () => TaskFilter | undefined;
};

const toggle = <T>(list: T[], item: T): T[] =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

/** key เปลี่ยนเมื่อ filter เปลี่ยน — ใช้เป็น dependency สำหรับ refetch ต่อ column */
export const selectFilterKey = (s: BoardFilterStore): string =>
  [
    s.q,
    s.priorities.join(','),
    s.tags.join(','),
    s.assigneeIds.join(','),
    s.mine,
    s.unassigned,
    s.due.join(','),
  ].join('|');

/** Just the filter, for a link (pair with useShallow). */
export const selectBoardFilter = (s: BoardFilterStore): BoardFilterState => ({
  q: s.q,
  priorities: s.priorities,
  tags: s.tags,
  assigneeIds: s.assigneeIds,
  mine: s.mine,
  unassigned: s.unassigned,
  due: s.due,
});

export const useBoardFilterStore = create<BoardFilterStore>((set, get) => ({
  ...EMPTY_BOARD_FILTER,
  setQ: (q) => set({ q }),
  togglePriority: (priority) =>
    set((s) => ({ priorities: toggle(s.priorities, priority) })),
  toggleTag: (tag) => set((s) => ({ tags: toggle(s.tags, tag) })),
  toggleAssignee: (userId) =>
    set((s) => ({ assigneeIds: toggle(s.assigneeIds, userId) })),
  toggleMine: () => set((s) => ({ mine: !s.mine })),
  toggleUnassigned: () => set((s) => ({ unassigned: !s.unassigned })),
  toggleDue: (bucket) => set((s) => ({ due: toggle(s.due, bucket) })),
  replace: (filter) => set(filter),
  clear: () => set(EMPTY_BOARD_FILTER),
  toFilterPayload: () => {
    const { q, priorities, tags, assigneeIds, mine, unassigned, due } = get();
    const filter: TaskFilter = {
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(priorities.length ? { priorities } : {}),
      ...(tags.length ? { tags } : {}),
      ...(assigneeIds.length ? { assigneeIds } : {}),
      ...(mine ? { mine } : {}),
      ...(unassigned ? { unassigned } : {}),
      ...(due.length ? { due, dueBounds: dueBounds() } : {}),
    };
    return isTaskFilterActive(filter) ? filter : undefined;
  },
}));

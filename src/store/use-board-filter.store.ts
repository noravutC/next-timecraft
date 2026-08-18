import { create } from 'zustand';
import type { TaskFilter, TaskPriority } from '@/types';
import { isTaskFilterActive } from '@/helper/utils/task-filter';

// UI state ของ filter บนบอร์ด — ไม่มี service; task store อ่าน payload ตอน fetch
type BoardFilterStore = {
  q: string;
  priorities: TaskPriority[];
  tags: string[];
  assigneeIds: string[];
  setQ: (q: string) => void;
  togglePriority: (priority: TaskPriority) => void;
  toggleTag: (tag: string) => void;
  toggleAssignee: (userId: string) => void;
  clear: () => void;
  /** payload สำหรับ API — undefined เมื่อไม่มีเงื่อนไขไหนเปิดอยู่ */
  toFilterPayload: () => TaskFilter | undefined;
};

const toggle = <T>(list: T[], item: T): T[] =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

/** key เปลี่ยนเมื่อ filter เปลี่ยน — ใช้เป็น dependency สำหรับ refetch ต่อ column */
export const selectFilterKey = (s: BoardFilterStore): string =>
  `${s.q}|${s.priorities.join(',')}|${s.tags.join(',')}|${s.assigneeIds.join(',')}`;

export const useBoardFilterStore = create<BoardFilterStore>((set, get) => ({
  q: '',
  priorities: [],
  tags: [],
  assigneeIds: [],
  setQ: (q) => set({ q }),
  togglePriority: (priority) =>
    set((s) => ({ priorities: toggle(s.priorities, priority) })),
  toggleTag: (tag) => set((s) => ({ tags: toggle(s.tags, tag) })),
  toggleAssignee: (userId) =>
    set((s) => ({ assigneeIds: toggle(s.assigneeIds, userId) })),
  clear: () => set({ q: '', priorities: [], tags: [], assigneeIds: [] }),
  toFilterPayload: () => {
    const { q, priorities, tags, assigneeIds } = get();
    const filter: TaskFilter = {
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(priorities.length ? { priorities } : {}),
      ...(tags.length ? { tags } : {}),
      ...(assigneeIds.length ? { assigneeIds } : {}),
    };
    return isTaskFilterActive(filter) ? filter : undefined;
  },
}));

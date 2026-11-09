import { create } from 'zustand';

export type UndoEntry = {
  id: number;
  /** puts things back as they were */
  undo: () => Promise<unknown>;
  /** the confirmation after undoing, e.g. "Back in In progress" */
  undoneTitle: string;
  /** offered after undoing, e.g. Archive again */
  redo?: { label: string; run: () => Promise<unknown> };
};

// enough for a run of ⌘Z presses; older changes drop off
const LIMIT = 20;

type UndoStore = {
  stack: UndoEntry[];
  push: (entry: Omit<UndoEntry, 'id'>) => number;
  /** removes and returns that entry, or the newest one */
  take: (id?: number) => UndoEntry | null;
};

let nextId = 1;

export const useUndoStore = create<UndoStore>((set, get) => ({
  stack: [],
  push: (entry) => {
    const id = nextId++;
    set((state) => ({
      stack: [...state.stack, { ...entry, id }].slice(-LIMIT),
    }));
    return id;
  },
  take: (id) => {
    const { stack } = get();
    const entry =
      id === undefined ? stack.at(-1) : stack.find((e) => e.id === id);
    if (!entry) return null;
    set({ stack: stack.filter((e) => e.id !== entry.id) });
    return entry;
  },
}));

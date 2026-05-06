import { create } from "zustand";

type TaskDetailStore = {
  openTaskId: string | null;
  open: (taskId: string) => void;
  close: () => void;
};

export const useTaskDetailStore = create<TaskDetailStore>((set) => ({
  openTaskId: null,
  open: (taskId) => set({ openTaskId: taskId }),
  close: () => set({ openTaskId: null }),
}));

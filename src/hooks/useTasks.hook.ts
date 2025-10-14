// src/hooks/useColumns.hook.ts
import { create } from "zustand";
import { Task } from "@/types";
import { taskServices } from "@/lib/services/tasks.service";
import { LoaderStatus } from "./hook.type";

interface TaskStore {
  tasks: Record<string, Task>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setTask: (columnId: string, columnData: Task) => void;
  setTasks: (tasks: Task[]) => void;
  clearTasks: () => void;

  // get
  getTaskById: (taskId: string | null | undefined) => Task | undefined;
  getTaskByColumnId: (columnId: string | null | undefined) => Task[];

  // fetch
  fetchTasksByColumnId: (columnId: string | null | undefined) => Promise<Task[]>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  status: "none",

  setStatus: (status) => set({ status }),

  setTask: (columnId, columnData) => {
    if (columnId !== columnData._id) {
      console.warn(`Task ID mismatch: ${columnId} !== ${columnData._id}`);
    }
    set((state) => ({
      tasks: {
        ...state.tasks,
        [columnId]: columnData,
      },
    }));
  },

  setTasks: (tasks) => {
    const mapped = tasks.reduce((acc, column) => {
      acc[column._id] = column;
      return acc;
    }, {} as Record<string, Task>);
    set((state) => ({
      tasks: {
        ...state.tasks,
        ...mapped,
      },
    }));
  },

  clearTasks: () => set({ tasks: {} }),

  getTaskById: (taskId: string | null | undefined) => {
    return get().tasks[taskId ?? ""];
  },
  
  getTaskByColumnId: (columnId: string | null | undefined) => {
    const allStateColumns = get().tasks;
    const filteredColumns = Object.values(allStateColumns).filter(
      (col) => col.columnId === (columnId ?? '')
    );
    return filteredColumns;
  },

  fetchTasksByColumnId: async (columnId: string | null | undefined) => {
    try {
      set({ status: "fetching" });
      const response = await taskServices.getTasksByColumnId(columnId ?? "");
      const tasks = response?.data || [];

      if (tasks.length > 0) {
        get().setTasks(tasks);
      }

      return tasks;
    } catch (error) {
      console.log("Failed to fetch projects:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));

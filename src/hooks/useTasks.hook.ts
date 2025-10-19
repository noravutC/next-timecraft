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
  setUpdatedTask: (taskId: string, updatedTask: Partial<Task>) => void;
  setTask: (taskId: string, taskData: Task) => void;
  setTasks: (tasks: Task[]) => void;
  clearTasks: () => void;

  // get
  getTaskById: (taskId: string | null | undefined) => Task | undefined;
  getTaskByColumnId: (columnId: string | null | undefined) => Task[];

  // fetch
  fetchTasksByColumnId: (
    columnId: string | null | undefined
  ) => Promise<Task[]>;
  // actions
  createTask: (data: Partial<Task>) => Promise<void>;
  moveTaskToColumn: (taskId: string, destinationColumnId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  status: "none",

  setStatus: (status) => set({ status }),
  setUpdatedTask: (taskId, updatedTask) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        [taskId]: {
          ...state.tasks[taskId],
          ...updatedTask,
        },
      },
    }));
  },

  setTask: (taskId, taskData) => {
    if (taskId !== taskData._id) {
      console.warn(`Task ID mismatch: ${taskId} !== ${taskData._id}`);
    }
    set((state) => ({
      tasks: {
        ...state.tasks,
        [taskId]: taskData,
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
      (col) => col.columnId === (columnId ?? "")
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

  createTask: async (data: Partial<Task>) => {
    try {
      set({ status: "creating" });
      const response = await taskServices.createTask(data);
      const createdTask = response?.created;

      if (createdTask) {
        get().setTask(createdTask._id, createdTask);
      }
    } catch (error) {
      console.log("Failed to create task:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  moveTaskToColumn: async (taskId: string, destinationColumnId: string) => {
    try {
      set({ status: "updating" });
      const task = get().getTaskById(taskId);
      if (!task) {
        console.log("Task not found with ID:", taskId);
        throw new Error("Task not found");
      }

      // const updatedData = {
      //   ...task,
      //   columnId: destinationColumnId,
      // };

      const response = await taskServices.moveTaskToColumn(taskId, destinationColumnId);
      const updatedTask = response?.updated;

      if (updatedTask) {
        console.log("updatedTask: ", updatedTask);
        get().setUpdatedTask(updatedTask._id, updatedTask);
      } else {
        console.log("No updated task returned from the service");
      }
    } catch (error) {
      console.log("Failed to move task to column:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));

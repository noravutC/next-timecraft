// src/hooks/useTasks.hook.ts
import { create } from "zustand";
import { Task, TaskCache } from "@/types";
import { taskServices } from "@/lib/services/tasks.service";
import { LoaderStatus } from "./hook.type";

export interface TaskStore {
  tasks: Record<string, TaskCache>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setUpdatedTask: (taskId: string, updatedTask: Partial<TaskCache>) => void;
  setTasks: (alreadyTasks: Record<string, TaskCache>) => void;
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
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  moveTaskToColumn: (
    projectId: string,
    taskId: string,
    destinationColumnId: string
  ) => Promise<void>;

  // pusher realtime action
  addTaskFromRealtime: (createdTask: Task) => void; 
  updateTaskFromRealtime: (updatedTask: Task) => void;
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

  setTasks: (alreadyTasks: Record<string, TaskCache>) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        ...alreadyTasks,
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

      return tasks;
    } catch (error) {
      console.log("Failed to fetch projects:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  addTaskFromRealtime: (createdTask: Task) => {
      set((state) => ({
          tasks: {
              ...state.tasks,
              [createdTask._id]: { ...createdTask, timestamp: Date.now() }
          }
      }))
  },

  updateTaskFromRealtime: (updatedTask: Task) => {
      set((state) => ({
          tasks: {
              ...state.tasks,
              [updatedTask._id]: { ...updatedTask, timestamp: Date.now() }
          }
      }))
  },

  createTask: async (data: Partial<Task>) => {
    try {
      set({ status: "creating" });
      const response = await taskServices.createTask(data);
      // const createdTask = response?.created;

      // if (createdTask) {
      //   set((state) => ({
      //     tasks: {
      //       ...state.tasks,
      //       [createdTask._id]: { ...createdTask, timestamp: Date.now() }
      //     }
      //   }))
      // }
    } catch (error) {
      console.log("Failed to create task:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  updateTask: async (taskId: string, data: Partial<Task>) => {
    try {
      set({ status: "updating" });
      const response = await taskServices.updateOneTask(taskId, data);
      // const updatedTask = response?.updated;

      // if (updatedTask) {
      //   set((state) => ({
      //     tasks: {
      //       ...state.tasks,
      //       [updatedTask._id]: { ...updatedTask, timestamp: Date.now() }
      //     }
      //   }))
      // }
    } catch (error) {
      console.log("Failed to update task:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  moveTaskToColumn: async (projectId: string, taskId: string, destinationColumnId: string) => {
    try {
      set({ status: "updating" });
      // const task = get().getTaskById(taskId);
      // if (!task) {
      //   console.log("Task not found with ID:", taskId);
      //   throw new Error("Task not found");
      // }

      const response = await taskServices.moveTaskToColumn(
        projectId,
        taskId,
        destinationColumnId
      );
      // const updatedTask = response?.updated;

      // if (updatedTask) {
      //   get().setUpdatedTask(updatedTask._id, updatedTask);
      // } else {
      //   console.log("No updated task returned from the service");
      // }
    } catch (error) {
      console.log("Failed to move task to column:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));

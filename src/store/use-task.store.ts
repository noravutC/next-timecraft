import { create } from "zustand";
import { CreateTaskPayload, Task, TaskCache, UpdateTaskPayload } from "@/types";
import { LoaderStatus } from "@/hooks/hook.type";
import { taskServices } from "@/services/tasks.service";
import { toRecord } from "@/helper/utils/object";
import { toast } from "sonner";
import { useColumnStore } from "./use-column.store";

type TaskStore = {
  status: LoaderStatus;
  tasks: { [taskId: string]: TaskCache };
  tasksLoader: {
    [taskId: string]: boolean;
  };
  createTasks: (payload: CreateTaskPayload[]) => Promise<TaskCache[] | null>;
  updateTasks: (taskIds: string[], payload: UpdateTaskPayload[]) => Promise<TaskCache[] | null>;
  deleteTasks: (taskIds: string[]) => Promise<void>;
  fetchTasksByColumns: (colIds: string[], limitTasks: number) => Promise<TaskCache[]>;
  updateTaskFromRealtime: (task: Task) => void;
};

export const useTaskStore = create<TaskStore>((set) => ({
  status: "none",
  tasks: {},
  tasksLoader: {},
  createTasks: async (payload) => {
    if (payload.length === 0) { toast.error("No tasks to create"); return null; }
    set({ status: "creating" });
    try {
      const response = await taskServices.createTasks(payload);
      const createdTasks = response.created;
      if (!createdTasks || createdTasks.length === 0) { set({ status: "none" }); return null; }
      set((state) => ({ tasks: { ...state.tasks, ...toRecord(createdTasks, "id") }, status: "none" }));
      return createdTasks;
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },

  updateTasks: async (taskIds, payload) => {
    if (taskIds.length === 0 || payload.length === 0) { toast.error("No tasks to update"); return null; }
    set({ status: "updating" });
    taskIds.forEach((taskId) => {
      set((state) => ({ tasksLoader: { ...state.tasksLoader, [taskId]: true } }));
    });
    try {
      const response = await taskServices.updateTasks(taskIds, payload);
      const updatedTasks = response.updated;
      if (!updatedTasks || updatedTasks.length === 0) { set({ status: "none" }); return null; }
      set((state) => ({ tasks: { ...state.tasks, ...toRecord(updatedTasks, "id") }, status: "none" }));
      return updatedTasks;
    } catch (error) {
      set({ status: "error" });
      throw error;
    } finally {
      set({ status: "none" });
      taskIds.forEach((taskId) => {
        set((state) => ({ tasksLoader: { ...state.tasksLoader, [taskId]: false } }));
      });
    }
  },

  deleteTasks: async (taskIds) => {
    if (taskIds.length === 0) { toast.error("No tasks to delete"); return; }
    set({ status: "deleting" });
    try {
      const response = await taskServices.deleteTasks(taskIds);
      if (!response.deleted) { set({ status: "none" }); toast.error("Failed to delete tasks"); return; }
      set((state) => {
        const newTasks = { ...state.tasks };
        taskIds.forEach((id) => delete newTasks[id]);
        return { tasks: newTasks, status: "none" };
      });
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },

  fetchTasksByColumns: async (colIds, limitTasks) => {
    if (!colIds || colIds.length === 0) return [];
    set({ status: "fetching" });
    useColumnStore.setState((state) => {
      const newLoader = { ...state.columnsLoader };
      colIds.forEach((colId) => { newLoader[colId] = true; });
      return { columnsLoader: newLoader };
    })
    try {
      const response = await taskServices.getTasksByColumns(colIds, limitTasks);
      const tasksData = response.data;
      set((state) => ({ tasks: { ...state.tasks, ...toRecord(tasksData, "id") }, status: "none" }));
      return tasksData;
    } catch (error) {
      set({ status: "error" });
      
      throw error;
    } finally {
      set({ status: "none" });
      useColumnStore.setState((state) => {
      const newLoader = { ...state.columnsLoader };
      colIds.forEach((colId) => { newLoader[colId] = false; });
      return { columnsLoader: newLoader };
    })
    }
  },

  // อัปเดต task จาก realtime event (Pusher) → store อัปเดต → board re-derives อัตโนมัติ
  updateTaskFromRealtime: (task) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        [task.id]: { ...task, timestamp: Date.now() },
      },
    }));
  },
}));

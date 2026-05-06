import { create } from "zustand";
import { toast } from "sonner";
import {
  assigneeServices,
  type TaskAssigneeUser,
} from "@/services/assignee.service";
import type { LoaderStatus } from "@/types/global/types";

type AssigneeState = {
  items: TaskAssigneeUser[];
  status: LoaderStatus;
  initialized: boolean;
};

const empty: AssigneeState = { items: [], status: "none", initialized: false };

type AssigneeStore = {
  byTask: Record<string, AssigneeState>;
  fetch: (taskId: string) => Promise<void>;
  setAll: (taskId: string, items: TaskAssigneeUser[]) => Promise<void>;
  ingestRealtime: (taskId: string, items: TaskAssigneeUser[]) => void;
};

export const useAssigneeStore = create<AssigneeStore>((set, get) => ({
  byTask: {},
  fetch: async (taskId) => {
    const cur = get().byTask[taskId];
    if (cur?.status === "fetching") return;
    set((s) => ({
      byTask: {
        ...s.byTask,
        [taskId]: { ...(s.byTask[taskId] ?? empty), status: "fetching" },
      },
    }));
    try {
      const res = await assigneeServices.list(taskId);
      set((s) => ({
        byTask: {
          ...s.byTask,
          [taskId]: {
            items: (res.data ?? []) as unknown as TaskAssigneeUser[],
            status: "none",
            initialized: true,
          },
        },
      }));
    } catch (err) {
      set((s) => ({
        byTask: {
          ...s.byTask,
          [taskId]: { ...(s.byTask[taskId] ?? empty), status: "error" },
        },
      }));
      console.error(err);
    }
  },
  setAll: async (taskId, items) => {
    const snapshot = get().byTask[taskId];
    set((s) => {
      const prev = s.byTask[taskId] ?? empty;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items,
            status: "updating",
            initialized: true,
          },
        },
      };
    });
    try {
      const userIds = items.map((it) => it.userId);
      const res = await assigneeServices.setAll(taskId, userIds);
      set((s) => ({
        byTask: {
          ...s.byTask,
          [taskId]: {
            items: res.updated ?? items,
            status: "none",
            initialized: true,
          },
        },
      }));
    } catch (err) {
      if (snapshot) {
        set((s) => ({ byTask: { ...s.byTask, [taskId]: snapshot } }));
      }
      toast.error("Failed to update assignees");
      console.error(err);
    }
  },
  ingestRealtime: (taskId, items) => {
    set((s) => ({
      byTask: {
        ...s.byTask,
        [taskId]: { items, status: "none", initialized: true },
      },
    }));
  },
}));

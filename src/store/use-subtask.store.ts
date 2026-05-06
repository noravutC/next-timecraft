import { create } from "zustand";
import { toast } from "sonner";
import { subtaskServices } from "@/services/subtask.service";
import { generateFractionBetween } from "@/helper/utils/fraction-string-indexing";
import type { Subtask, UpdateSubtaskPayload } from "@/types";
import type { LoaderStatus } from "@/types/global/types";

type TaskState = {
  items: Subtask[];
  status: LoaderStatus;
  initialized: boolean;
};

const empty: TaskState = { items: [], status: "none", initialized: false };

const sortItems = (items: Subtask[]) =>
  [...items].sort((a, b) => {
    if (a.orderFraction === b.orderFraction) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return a.orderFraction < b.orderFraction ? -1 : 1;
  });

type SubtaskStore = {
  byTask: Record<string, TaskState>;
  fetch: (taskId: string) => Promise<void>;
  create: (taskId: string, title: string) => Promise<void>;
  update: (
    subtaskId: string,
    taskId: string,
    payload: UpdateSubtaskPayload,
  ) => Promise<void>;
  remove: (subtaskId: string, taskId: string) => Promise<void>;
  ingestAdded: (taskId: string, subtask: Subtask) => void;
  ingestUpdated: (taskId: string, subtask: Subtask) => void;
  ingestDeleted: (taskId: string, subtaskId: string) => void;
};

const pendingUpdatesBySubtask: Record<string, number> = {};

export const useSubtaskStore = create<SubtaskStore>((set, get) => ({
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
      const res = await subtaskServices.list(taskId);
      set((s) => ({
        byTask: {
          ...s.byTask,
          [taskId]: {
            items: sortItems(res.data ?? []),
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

  create: async (taskId, title) => {
    const items = get().byTask[taskId]?.items ?? [];
    const last = items[items.length - 1]?.orderFraction ?? null;
    const orderFraction = generateFractionBetween(last, null);
    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = new Date();
    const optimistic: Subtask = {
      id: tempId,
      taskId,
      title,
      completed: false,
      orderFraction,
      createdAt: now,
      updatedAt: now,
    } as Subtask;

    set((s) => {
      const prev = s.byTask[taskId] ?? empty;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: sortItems([...prev.items, optimistic]),
            initialized: true,
          },
        },
      };
    });

    try {
      const res = await subtaskServices.create(taskId, { title, orderFraction });
      if (!res.created) return;
      const created = res.created;
      set((s) => {
        const prev = s.byTask[taskId];
        if (!prev) return s;
        const replaced = prev.items.some((it) => it.id === created.id)
          ? prev.items.filter((it) => it.id !== tempId)
          : prev.items.map((it) => (it.id === tempId ? created : it));
        return {
          byTask: {
            ...s.byTask,
            [taskId]: { ...prev, items: sortItems(replaced) },
          },
        };
      });
    } catch (err) {
      set((s) => {
        const prev = s.byTask[taskId];
        if (!prev) return s;
        return {
          byTask: {
            ...s.byTask,
            [taskId]: {
              ...prev,
              items: prev.items.filter((it) => it.id !== tempId),
            },
          },
        };
      });
      toast.error("Failed to add subtask");
      console.error(err);
    }
  },

  update: async (subtaskId, taskId, payload) => {
    const snapshot = get().byTask[taskId];
    pendingUpdatesBySubtask[subtaskId] =
      (pendingUpdatesBySubtask[subtaskId] ?? 0) + 1;
    set((s) => {
      const prev = s.byTask[taskId] ?? empty;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: prev.items.map((it) =>
              it.id === subtaskId ? { ...it, ...payload } : it,
            ),
          },
        },
      };
    });
    try {
      await subtaskServices.update(subtaskId, payload);
    } catch (err) {
      if (snapshot) set((s) => ({ byTask: { ...s.byTask, [taskId]: snapshot } }));
      toast.error("Failed to update subtask");
      console.error(err);
    } finally {
      const next = (pendingUpdatesBySubtask[subtaskId] ?? 1) - 1;
      if (next <= 0) delete pendingUpdatesBySubtask[subtaskId];
      else pendingUpdatesBySubtask[subtaskId] = next;
    }
  },

  remove: async (subtaskId, taskId) => {
    const snapshot = get().byTask[taskId];
    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: prev.items.filter((it) => it.id !== subtaskId),
          },
        },
      };
    });
    try {
      await subtaskServices.remove(subtaskId);
    } catch (err) {
      if (snapshot) set((s) => ({ byTask: { ...s.byTask, [taskId]: snapshot } }));
      toast.error("Failed to delete subtask");
      console.error(err);
    }
  },

  ingestAdded: (taskId, subtask) => {
    set((s) => {
      const prev = s.byTask[taskId] ?? empty;
      if (prev.items.some((it) => it.id === subtask.id)) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: sortItems([...prev.items, subtask]),
            initialized: true,
          },
        },
      };
    });
  },

  ingestUpdated: (taskId, subtask) => {
    if ((pendingUpdatesBySubtask[subtask.id] ?? 0) > 0) return;
    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: sortItems(
              prev.items.map((it) => (it.id === subtask.id ? subtask : it)),
            ),
          },
        },
      };
    });
  },

  ingestDeleted: (taskId, subtaskId) => {
    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: prev.items.filter((it) => it.id !== subtaskId),
          },
        },
      };
    });
  },
}));

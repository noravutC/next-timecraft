import { create } from "zustand";
import { toast } from "sonner";
import { commentServices } from "@/services/comment.service";
import { useTaskStore } from "./use-task.store";
import type {
  AttachmentInput,
  CreateCommentPayload,
  ReactionSummary,
  TaskCommentAttachment,
  TaskCommentWithAuthor,
  UpdateCommentPayload,
} from "@/types";
import type { LoaderStatus } from "@/types/global/types";

const PAGE_SIZE = 30;

type TaskState = {
  items: TaskCommentWithAuthor[];
  cursor: string | null;
  hasMore: boolean;
  status: LoaderStatus;
  unreadCount: number;
  initialized: boolean;
};

const emptyState: TaskState = {
  items: [],
  cursor: null,
  hasMore: false,
  status: "none",
  unreadCount: 0,
  initialized: false,
};

type CommentStore = {
  byTask: Record<string, TaskState>;
  pendingClientIds: Record<string, true>;
  fetchInitial: (taskId: string) => Promise<void>;
  fetchMore: (taskId: string) => Promise<void>;
  create: (
    taskId: string,
    payload: {
      body: string;
      mentions: string[];
      authorId: string;
      authorName: string;
      authorAvatar: string | null;
      attachments?: TaskCommentAttachment[];
      attachmentInputs?: AttachmentInput[];
    },
  ) => Promise<TaskCommentWithAuthor | null>;
  toggleReaction: (commentId: string, taskId: string, emoji: string, userId: string) => Promise<void>;
  ingestReactionChanged: (taskId: string, commentId: string, reactions: ReactionSummary[]) => void;
  update: (
    commentId: string,
    taskId: string,
    payload: UpdateCommentPayload,
  ) => Promise<void>;
  remove: (commentId: string, taskId: string) => Promise<void>;
  markRead: (taskId: string, lastReadCommentId: string | null) => Promise<void>;
  ingestAdded: (taskId: string, comment: TaskCommentWithAuthor, clientId: string | null) => void;
  ingestUpdated: (taskId: string, comment: TaskCommentWithAuthor) => void;
  ingestDeleted: (taskId: string, commentId: string) => void;
  reset: (taskId: string) => void;
};

const buildOptimisticAttachments = (
  inputs: AttachmentInput[],
  commentId: string,
): TaskCommentAttachment[] =>
  inputs.map((a, idx) => ({
    id: `temp-att-${commentId}-${idx}`,
    commentId,
    type: a.type,
    storagePath: a.storagePath,
    url: a.url,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    width: a.width ?? null,
    height: a.height ?? null,
    durationMs: a.durationMs ?? null,
    orderIndex: idx,
    createdAt: new Date(),
  }));

const sortDescByCreatedAt = (a: TaskCommentWithAuthor, b: TaskCommentWithAuthor) => {
  const ad = new Date(a.createdAt).getTime();
  const bd = new Date(b.createdAt).getTime();
  if (ad !== bd) return bd - ad;
  return a.id < b.id ? 1 : -1;
};

export const useCommentStore = create<CommentStore>((set, get) => ({
  byTask: {},
  pendingClientIds: {},

  fetchInitial: async (taskId) => {
    const cur = get().byTask[taskId];
    if (cur?.status === "fetching") return;
    set((s) => ({
      byTask: {
        ...s.byTask,
        [taskId]: { ...(s.byTask[taskId] ?? emptyState), status: "fetching" },
      },
    }));
    try {
      const res = await commentServices.fetchPage(taskId, null, PAGE_SIZE);
      set((s) => ({
        byTask: {
          ...s.byTask,
          [taskId]: {
            items: res.data.items,
            cursor: res.data.nextCursor,
            hasMore: res.data.hasMore,
            unreadCount: res.data.unreadCount,
            status: "none",
            initialized: true,
          },
        },
      }));
    } catch (err) {
      set((s) => ({
        byTask: {
          ...s.byTask,
          [taskId]: { ...(s.byTask[taskId] ?? emptyState), status: "error" },
        },
      }));
      console.error(err);
    }
  },

  fetchMore: async (taskId) => {
    const cur = get().byTask[taskId];
    if (!cur || !cur.hasMore || cur.status === "fetching") return;
    set((s) => ({
      byTask: { ...s.byTask, [taskId]: { ...cur, status: "fetching" } },
    }));
    try {
      const res = await commentServices.fetchPage(taskId, cur.cursor, PAGE_SIZE);
      set((s) => {
        const prev = s.byTask[taskId];
        if (!prev) return s;
        const seen = new Set(prev.items.map((c) => c.id));
        const merged = [
          ...prev.items,
          ...res.data.items.filter((c) => !seen.has(c.id)),
        ];
        return {
          byTask: {
            ...s.byTask,
            [taskId]: {
              ...prev,
              items: merged,
              cursor: res.data.nextCursor,
              hasMore: res.data.hasMore,
              status: "none",
            },
          },
        };
      });
    } catch (err) {
      set((s) => {
        const prev = s.byTask[taskId];
        if (!prev) return s;
        return {
          byTask: { ...s.byTask, [taskId]: { ...prev, status: "error" } },
        };
      });
      console.error(err);
    }
  },

  create: async (taskId, payload) => {
    const clientId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const optimistic: TaskCommentWithAuthor = {
      id: `temp-${clientId}`,
      taskId,
      userId: payload.authorId,
      body: payload.body,
      mentions: payload.mentions,
      clientId,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorName: payload.authorName,
      authorAvatar: payload.authorAvatar,
      attachments: payload.attachments ?? buildOptimisticAttachments(payload.attachmentInputs ?? [], `temp-${clientId}`),
      reactions: [],
    };

    set((s) => {
      const prev = s.byTask[taskId] ?? emptyState;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: [optimistic, ...prev.items].sort(sortDescByCreatedAt),
          },
        },
        pendingClientIds: { ...s.pendingClientIds, [clientId]: true },
      };
    });

    useTaskStore.setState((s) => {
      const t = s.tasks[taskId];
      if (!t) return s;
      return {
        tasks: {
          ...s.tasks,
          [taskId]: { ...t, commentCount: (t.commentCount ?? 0) + 1 },
        },
      };
    });

    try {
      const body: CreateCommentPayload = {
        body: payload.body,
        mentions: payload.mentions,
        clientId,
        attachments: payload.attachmentInputs ?? [],
      };
      const res = await commentServices.create(taskId, body);
      const real = res.created;
      if (!real) throw new Error("No comment returned");

      set((s) => {
        const prev = s.byTask[taskId];
        if (!prev) return s;
        const replaced = prev.items.map((c) =>
          c.clientId === clientId ? real : c,
        );
        return {
          byTask: {
            ...s.byTask,
            [taskId]: {
              ...prev,
              items: replaced.sort(sortDescByCreatedAt),
            },
          },
        };
      });
      return real;
    } catch (err) {
      set((s) => {
        const prev = s.byTask[taskId];
        if (!prev) return s;
        return {
          byTask: {
            ...s.byTask,
            [taskId]: {
              ...prev,
              items: prev.items.filter((c) => c.clientId !== clientId),
            },
          },
        };
      });
      useTaskStore.setState((s) => {
        const t = s.tasks[taskId];
        if (!t) return s;
        return {
          tasks: {
            ...s.tasks,
            [taskId]: {
              ...t,
              commentCount: Math.max((t.commentCount ?? 0) - 1, 0),
            },
          },
        };
      });
      toast.error("Failed to send comment");
      console.error(err);
      return null;
    } finally {
      set((s) => {
        const next = { ...s.pendingClientIds };
        delete next[clientId];
        return { pendingClientIds: next };
      });
    }
  },

  update: async (commentId, taskId, payload) => {
    const snapshot = get().byTask[taskId];
    if (!snapshot) return;
    const target = snapshot.items.find((c) => c.id === commentId);
    if (!target) return;

    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: prev.items.map((c) =>
              c.id === commentId
                ? { ...c, body: payload.body, mentions: payload.mentions }
                : c,
            ),
          },
        },
      };
    });

    try {
      const res = await commentServices.update(commentId, payload);
      if (!res.updated) return;
      set((s) => {
        const prev = s.byTask[taskId];
        if (!prev) return s;
        return {
          byTask: {
            ...s.byTask,
            [taskId]: {
              ...prev,
              items: prev.items.map((c) =>
                c.id === commentId ? res.updated! : c,
              ),
            },
          },
        };
      });
    } catch (err) {
      set((s) => ({ byTask: { ...s.byTask, [taskId]: snapshot } }));
      toast.error("Failed to update comment");
      console.error(err);
    }
  },

  remove: async (commentId, taskId) => {
    const snapshot = get().byTask[taskId];
    if (!snapshot) return;

    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: prev.items.filter((c) => c.id !== commentId),
          },
        },
      };
    });
    useTaskStore.setState((s) => {
      const t = s.tasks[taskId];
      if (!t) return s;
      return {
        tasks: {
          ...s.tasks,
          [taskId]: {
            ...t,
            commentCount: Math.max((t.commentCount ?? 0) - 1, 0),
          },
        },
      };
    });

    try {
      await commentServices.remove(commentId);
    } catch (err) {
      set((s) => ({ byTask: { ...s.byTask, [taskId]: snapshot } }));
      useTaskStore.setState((s) => {
        const t = s.tasks[taskId];
        if (!t) return s;
        return {
          tasks: {
            ...s.tasks,
            [taskId]: { ...t, commentCount: (t.commentCount ?? 0) + 1 },
          },
        };
      });
      toast.error("Failed to delete comment");
      console.error(err);
    }
  },

  markRead: async (taskId, lastReadCommentId) => {
    if (!lastReadCommentId) return;
    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: { ...s.byTask, [taskId]: { ...prev, unreadCount: 0 } },
      };
    });
    try {
      await commentServices.markRead(taskId, lastReadCommentId);
    } catch (err) {
      console.error(err);
    }
  },

  ingestAdded: (taskId, comment, clientId) => {
    if (clientId && get().pendingClientIds[clientId]) return;
    set((s) => {
      const prev = s.byTask[taskId] ?? emptyState;
      if (prev.items.some((c) => c.id === comment.id)) return s;
      const replaced =
        clientId
          ? prev.items.filter((c) => c.clientId !== clientId)
          : prev.items;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: [comment, ...replaced].sort(sortDescByCreatedAt),
            unreadCount: prev.unreadCount + 1,
          },
        },
      };
    });
  },

  ingestUpdated: (taskId, comment) => {
    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: prev.items.map((c) => (c.id === comment.id ? comment : c)),
          },
        },
      };
    });
  },

  ingestDeleted: (taskId, commentId) => {
    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: prev.items.filter((c) => c.id !== commentId),
          },
        },
      };
    });
  },

  toggleReaction: async (commentId, taskId, emoji, userId) => {
    const snapshot = get().byTask[taskId];
    if (!snapshot) return;

    const applyToggle = (reactions: ReactionSummary[]): ReactionSummary[] => {
      const existing = reactions.find((r) => r.emoji === emoji);
      if (!existing) {
        return [...reactions, { emoji, count: 1, userIds: [userId] }];
      }
      const has = existing.userIds.includes(userId);
      const nextUsers = has
        ? existing.userIds.filter((id) => id !== userId)
        : [...existing.userIds, userId];
      const updated: ReactionSummary = {
        emoji,
        count: nextUsers.length,
        userIds: nextUsers,
      };
      const without = reactions.filter((r) => r.emoji !== emoji);
      return updated.count === 0 ? without : [...without, updated];
    };

    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: prev.items.map((c) =>
              c.id === commentId
                ? { ...c, reactions: applyToggle(c.reactions) }
                : c,
            ),
          },
        },
      };
    });

    try {
      await commentServices.toggleReaction(commentId, emoji);
    } catch (err) {
      set((s) => ({ byTask: { ...s.byTask, [taskId]: snapshot } }));
      toast.error("Failed to react");
      console.error(err);
    }
  },

  ingestReactionChanged: (taskId, commentId, reactions) => {
    set((s) => {
      const prev = s.byTask[taskId];
      if (!prev) return s;
      return {
        byTask: {
          ...s.byTask,
          [taskId]: {
            ...prev,
            items: prev.items.map((c) =>
              c.id === commentId ? { ...c, reactions } : c,
            ),
          },
        },
      };
    });
  },

  reset: (taskId) => {
    set((s) => {
      const next = { ...s.byTask };
      delete next[taskId];
      return { byTask: next };
    });
  },
}));

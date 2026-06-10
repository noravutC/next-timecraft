"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useCommentStore } from "@/store/use-comment.store";
import type { ReactionSummary, TaskCommentWithAuthor } from "@/types";

export const useTaskComments = (taskId?: string | null) => {
  const fetchInitial = useCommentStore((s) => s.fetchInitial);
  const ingestAdded = useCommentStore((s) => s.ingestAdded);
  const ingestUpdated = useCommentStore((s) => s.ingestUpdated);
  const ingestDeleted = useCommentStore((s) => s.ingestDeleted);
  const ingestReactionChanged = useCommentStore((s) => s.ingestReactionChanged);

  useEffect(() => {
    if (!taskId) return;
    fetchInitial(taskId);

    const channelName = `task-${taskId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind(
      "comment-added",
      (data: { comment: TaskCommentWithAuthor; clientId: string | null }) => {
        ingestAdded(taskId, data.comment, data.clientId);
      },
    );
    channel.bind("comment-updated", (comment: TaskCommentWithAuthor) => {
      ingestUpdated(taskId, comment);
    });
    channel.bind("comment-deleted", ({ id }: { id: string }) => {
      ingestDeleted(taskId, id);
    });
    channel.bind(
      "comment-reaction-changed",
      (data: { commentId: string; reactions: ReactionSummary[] }) => {
        ingestReactionChanged(taskId, data.commentId, data.reactions);
      },
    );

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [
    taskId,
    fetchInitial,
    ingestAdded,
    ingestUpdated,
    ingestDeleted,
    ingestReactionChanged,
  ]);
};

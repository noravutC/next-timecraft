"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useSubtaskStore } from "@/store/use-subtask.store";
import type { Subtask } from "@/types";

export const useTaskSubtasks = (taskId?: string | null) => {
  const fetch = useSubtaskStore((s) => s.fetch);
  const ingestAdded = useSubtaskStore((s) => s.ingestAdded);
  const ingestUpdated = useSubtaskStore((s) => s.ingestUpdated);
  const ingestDeleted = useSubtaskStore((s) => s.ingestDeleted);

  useEffect(() => {
    if (!taskId) return;
    fetch(taskId);

    const channelName = `task-${taskId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("subtask-added", (s: Subtask) => ingestAdded(taskId, s));
    channel.bind("subtask-updated", (s: Subtask) => ingestUpdated(taskId, s));
    channel.bind("subtask-deleted", ({ id }: { id: string }) =>
      ingestDeleted(taskId, id),
    );

    return () => {
      channel.unbind("subtask-added");
      channel.unbind("subtask-updated");
      channel.unbind("subtask-deleted");
    };
  }, [taskId, fetch, ingestAdded, ingestUpdated, ingestDeleted]);
};

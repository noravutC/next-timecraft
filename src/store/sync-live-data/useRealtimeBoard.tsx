"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useTaskStore } from "@/store/use-task.store";
import { useAssigneeStore } from "@/store/use-assignee.store";
import type { TaskAssigneeUser } from "@/services/assignee.service";
import { Task } from "@/types";

export const useRealtimeBoard = (projectId?: string | null) => {
  const { updateTaskFromRealtime } = useTaskStore();

  useEffect(() => {
    if (!projectId) return;

    const channelName = `project-${projectId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("task-updated", (updatedTask: Task) => {
      updateTaskFromRealtime(updatedTask);
    });

    channel.bind(
      "task-assignees-updated",
      (data: { taskId: string; assignees: TaskAssigneeUser[] }) => {
        useAssigneeStore.getState().ingestRealtime(data.taskId, data.assignees);
      },
    );

    channel.bind(
      "task-comment-count",
      ({ taskId, delta }: { taskId: string; delta: number }) => {
        useTaskStore.setState((s) => {
          const t = s.tasks[taskId];
          if (!t) return s;
          return {
            tasks: {
              ...s.tasks,
              [taskId]: {
                ...t,
                commentCount: Math.max((t.commentCount ?? 0) + delta, 0),
              },
            },
          };
        });
      },
    );

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [projectId, updateTaskFromRealtime]);
};

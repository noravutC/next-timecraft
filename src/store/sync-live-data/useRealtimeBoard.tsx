'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { privateChannel } from '@/helper/utils/realtime-channel';
import { pusherClient } from '@/lib/pusher-client';
import { useTaskStore } from '@/store/use-task.store';
import { useSubtaskStore } from '@/store/use-subtask.store';
import { useAssigneeStore } from '@/store/use-assignee.store';
import { useUnreadStore } from '@/store/use-unread.store';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import type { TaskAssigneeUser } from '@/services/assignee.service';
import { Task } from '@/types';
import type { TagRenames } from '@/helper/utils/tag-rename';

export const useRealtimeBoard = (projectId?: string | null) => {
  const {
    updateTaskFromRealtime,
    addTasksFromRealtime,
    removeTasksFromRealtime,
  } = useTaskStore();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!projectId) return;

    const channelName = privateChannel(`project-${projectId}`);
    const channel = pusherClient.subscribe(channelName);

    channel.bind('tasks-created', (tasks: Task[]) => {
      addTasksFromRealtime(tasks);
    });

    channel.bind('tasks-updated', (tasks: Task[]) => {
      tasks.forEach((t) => updateTaskFromRealtime(t));
    });

    channel.bind('tasks-deleted', (ids: string[]) => {
      removeTasksFromRealtime(ids);
    });

    channel.bind('tags-renamed', ({ renames }: { renames: TagRenames }) => {
      useTaskStore.getState().renameTagsOnBoard(projectId, renames);
    });

    channel.bind(
      'task-assignees-updated',
      (data: { taskId: string; assignees: TaskAssigneeUser[] }) => {
        useAssigneeStore.getState().ingestRealtime(data.taskId, data.assignees);
      },
    );

    channel.bind(
      'subtask-progress',
      ({
        taskId,
        done,
        total,
      }: {
        taskId: string;
        done: number;
        total: number;
      }) => {
        useSubtaskStore
          .getState()
          .ingestProgress({ [taskId]: { done, total } });
      },
    );

    channel.bind(
      'task-comment-count',
      ({
        taskId,
        delta,
        authorId,
      }: {
        taskId: string;
        delta: number;
        authorId?: string;
      }) => {
        // a new comment from someone else is unread, unless that task is
        // open right now (the sheet marks it read)
        if (
          delta > 0 &&
          authorId !== userId &&
          useTaskDetailStore.getState().openTaskId !== taskId
        ) {
          useUnreadStore.getState().bump(taskId, 1);
        }
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
  }, [
    projectId,
    userId,
    updateTaskFromRealtime,
    addTasksFromRealtime,
    removeTasksFromRealtime,
  ]);
};

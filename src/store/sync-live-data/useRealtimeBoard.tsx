'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { privateChannel } from '@/helper/utils/realtime-channel';
import { pusherClient } from '@/lib/pusher-client';
import { toast } from 'sonner';
import { useTaskStore } from '@/store/use-task.store';
import { useColumnStore } from '@/store/use-column.store';
import { useDependencyStore } from '@/store/use-dependency.store';
import { useProjectStore } from '@/store/use-project.store';
import { useSubtaskStore } from '@/store/use-subtask.store';
import { useAssigneeStore } from '@/store/use-assignee.store';
import { useUnreadStore } from '@/store/use-unread.store';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import type { TaskAssigneeUser } from '@/services/assignee.service';
import { BlockerRef, ColumnRow, Task } from '@/types';
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
      'blockers-updated',
      ({ taskId, blockers }: { taskId: string; blockers: BlockerRef[] }) => {
        useDependencyStore.getState().setBlockers(taskId, blockers);
      },
    );

    channel.bind('columns-upserted', (columns: ColumnRow[]) => {
      useColumnStore.getState().ingestColumns(columns);
    });

    channel.bind('columns-deleted', (ids: string[]) => {
      useColumnStore.getState().removeColumnsFromRealtime(ids);
    });

    // the board, or who's on it, changed: read it again
    channel.bind('board-changed', () => {
      const name = useProjectStore.getState().projects[projectId]?.name;
      void useProjectStore
        .getState()
        .refreshProject(projectId)
        .then((result) => {
          if (result === 'lost') {
            toast.message(`You no longer have access to ${name ?? 'a board'}`);
          }
        })
        .catch(() => {});
    });

    channel.bind('board-deleted', () => {
      const name = useProjectStore.getState().projects[projectId]?.name;
      useProjectStore.getState().removeProject(projectId);
      toast.message(`${name ?? 'A board'} was deleted`);
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

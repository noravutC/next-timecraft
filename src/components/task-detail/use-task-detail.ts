import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { useTaskStore } from '@/store/use-task.store';
import { useColumnStore } from '@/store/use-column.store';
import { useProjectStore } from '@/store';
import { useUserStore } from '@/store/use-user.store';
import { useAssigneeStore } from '@/store/use-assignee.store';
import { useShallow } from 'zustand/react/shallow';
import { useTaskComments } from '@/store/sync-live-data/useTaskComments';
import { useTaskSubtasks } from '@/store/sync-live-data/useTaskSubtasks';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import { withSettingsDefaults } from '@/types/project-settings';
import type { UpdateTaskPayload } from '@/types';

/**
 * State + derivations + handlers ของ Task detail dialog:
 * subscribe stores, สร้าง candidates/columns, persist การแก้ค่าแต่ละ field
 */
export function useTaskDetail() {
  const openTaskId = useTaskDetailStore((s) => s.openTaskId);
  const close = useTaskDetailStore((s) => s.close);

  const task = useTaskStore((s) =>
    openTaskId ? s.tasks[openTaskId] : undefined,
  );
  const updateTasks = useTaskStore((s) => s.updateTasks);
  const allTasks = useTaskStore(useShallow((s) => s.tasks));

  const columnsMap = useColumnStore(useShallow((s) => s.columns));

  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const project = useProjectStore((s) =>
    projectIsUsing ? s.projects[projectIsUsing] : null,
  );
  const users = useUserStore(useShallow((s) => s.users));

  const assigneeState = useAssigneeStore(
    useShallow((s) => (openTaskId ? s.byTask[openTaskId] : undefined)),
  );
  const fetchAssignees = useAssigneeStore((s) => s.fetch);
  const setAssignees = useAssigneeStore((s) => s.setAll);

  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const userName = session?.user?.name ?? 'You';
  const userAvatar = session?.user?.image ?? null;

  useTaskComments(openTaskId);
  useTaskSubtasks(openTaskId);

  useEffect(() => {
    if (openTaskId) fetchAssignees(openTaskId);
  }, [openTaskId, fetchAssignees]);

  const settings = useMemo(
    () => withSettingsDefaults(project?.settings ?? null),
    [project?.settings],
  );

  const projectColumns = useMemo(() => {
    if (!project) return [];
    return Object.values(columnsMap)
      .filter((c) => c.projectId === project.id && !c.isDeleted)
      .sort((a, b) => (a.orderFraction < b.orderFraction ? -1 : 1));
  }, [columnsMap, project]);

  const memberCandidates = useMemo(() => {
    if (!project?.members) return [];
    return project.members
      .map((m) => {
        const u = users[m.userId];
        return u
          ? {
              id: u.id,
              name: u.fullName,
              avatar: u.avatar ?? null,
              email: u.email ?? '',
            }
          : null;
      })
      .filter(<T>(c: T | null): c is T => c !== null);
  }, [project?.members, users]);

  const assignees = assigneeState?.items ?? [];
  const assigneeIds = assignees.map((a) => a.userId);

  const buildAssigneeItems = (ids: string[]) =>
    ids
      .map((id) => {
        const existing = assignees.find((a) => a.userId === id);
        if (existing) return existing;
        const u = users[id];
        if (!u) return null;
        return {
          userId: u.id,
          fullName: u.fullName,
          avatar: u.avatar ?? null,
          email: u.email ?? '',
        };
      })
      .filter(<T>(it: T | null): it is T => it !== null);

  const persist = (payload: Partial<UpdateTaskPayload>) => {
    if (!task) return;
    updateTasks(
      [task.id],
      [
        {
          id: task.id,
          columnId: task.columnId,
          title: task.title,
          ...payload,
        } as UpdateTaskPayload,
      ],
    );
  };

  const handleStatusChange = (nextColumnId: string) => {
    if (!task || nextColumnId === task.columnId) return;
    const fractions = Object.values(allTasks)
      .filter((t) => t.columnId === nextColumnId && t.id !== task.id)
      .map((t) => t.orderFraction)
      .sort();
    const last = fractions[fractions.length - 1] ?? null;
    const orderFraction = generateFractionBetween(
      last,
      useTaskStore.getState().columnEndBound(nextColumnId),
    );
    persist({ columnId: nextColumnId, orderFraction });
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined' || !task) return;
    const url = `${window.location.origin}/project?taskId=${task.id}`;
    navigator.clipboard.writeText(url);
    toast('Link copied');
  };

  const handleArchive = () => {
    if (!task) return;
    persist({ archived: true });
    toast('Task archived', {
      action: { label: 'Undo', onClick: () => persist({ archived: false }) },
    });
    close();
  };

  const dueDate = task?.dueDate ? new Date(task.dueDate) : null;

  return {
    openTaskId,
    close,
    task,
    project,
    columnsMap,
    projectColumns,
    memberCandidates,
    settings,
    assignees,
    assigneeIds,
    setAssignees,
    buildAssigneeItems,
    userId,
    userName,
    userAvatar,
    dueDate,
    persist,
    handleStatusChange,
    handleCopyLink,
    handleArchive,
  };
}

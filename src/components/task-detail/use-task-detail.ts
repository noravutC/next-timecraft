import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { useTaskStore } from '@/store/use-task.store';
import { offerUndo } from '@/components/undo/offer-undo';
import { pickKeys } from '@/helper/utils/object';
import { useColumnStore } from '@/store/use-column.store';
import { useProjectStore } from '@/store';
import { useUserStore } from '@/store/use-user.store';
import { useAssigneeStore } from '@/store/use-assignee.store';
import { useShallow } from 'zustand/react/shallow';
import { useTaskComments } from '@/store/sync-live-data/useTaskComments';
import { useTaskSubtasks } from '@/store/sync-live-data/useTaskSubtasks';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import { withSettingsDefaults } from '@/types/project-settings';
import { boardUrl } from '@/helper/utils/board-url';
import { useBoardAccess } from '@/components/project/use-board-access';
import type { UpdateTaskPayload } from '@/types';

/**
 * State + derivations + handlers ของ Task detail dialog:
 * subscribe stores, สร้าง candidates/columns, persist การแก้ค่าแต่ละ field
 */
export function useTaskDetail() {
  const openTaskId = useTaskDetailStore((s) => s.openTaskId);
  const close = useTaskDetailStore((s) => s.close);

  // งานที่แสดงอยู่ — ค้างไว้หลังปิดเพื่อให้ Sheet เลื่อนออกพร้อมเนื้อหา
  // (ไม่วูบเป็นหน้าโหลด); subscription ทั้งหมดยังผูกกับ openTaskId
  const [shownTaskId, setShownTaskId] = useState(openTaskId);
  if (openTaskId && openTaskId !== shownTaskId) setShownTaskId(openTaskId);
  const taskId = openTaskId ?? shownTaskId;

  const task = useTaskStore((s) => (taskId ? s.tasks[taskId] : undefined));
  const updateTasks = useTaskStore((s) => s.updateTasks);
  const allTasks = useTaskStore(useShallow((s) => s.tasks));

  const columnsMap = useColumnStore(useShallow((s) => s.columns));

  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const project = useProjectStore((s) =>
    projectIsUsing ? s.projects[projectIsUsing] : null,
  );
  const users = useUserStore(useShallow((s) => s.users));

  const assigneeState = useAssigneeStore(
    useShallow((s) => (taskId ? s.byTask[taskId] : undefined)),
  );
  const fetchAssignees = useAssigneeStore((s) => s.fetch);
  const setAssignees = useAssigneeStore((s) => s.setAll);

  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  // a viewer, or anyone on an archived board, gets a read-only sheet
  const access = useBoardAccess();
  const readOnly = !access.can('task:update');
  const canComment = access.can('task:comment');
  const canReact = access.can('comment:react');
  const canManageOwnComments = access.can('comment:update');
  const commentBlockedNote = access.archived
    ? 'This board is archived. Restore it to comment.'
    : 'Viewers can read and react to comments, but can’t write them.';
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

  const members = project?.members;
  const memberCandidates = useMemo(() => {
    if (!members) return [];
    return members
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
  }, [members, users]);

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

  // the task as it is when this runs, so an undo never resends stale fields
  const writeTask = (taskId: string, fields: Partial<UpdateTaskPayload>) => {
    const current = useTaskStore.getState().tasks[taskId];
    if (!current) return Promise.resolve(null);
    return updateTasks(
      [taskId],
      [
        {
          id: taskId,
          columnId: current.columnId,
          title: current.title,
          ...fields,
        } as UpdateTaskPayload,
      ],
    );
  };

  /** Saves fields; ⌘Z puts back what they were (status changes say so). */
  const persist = (
    payload: Partial<UpdateTaskPayload>,
    undoToast?: { title: string; emphasis: string; undoneTitle: string },
  ) => {
    if (!task) return;
    const taskId = task.id;
    const previous = pickKeys(
      task as UpdateTaskPayload,
      Object.keys(payload) as (keyof UpdateTaskPayload)[],
    );
    void writeTask(taskId, payload);
    offerUndo({
      icon: undoToast ? 'move' : 'edit',
      title: undoToast?.title ?? 'Edited',
      emphasis: undoToast?.emphasis,
      undo: () => writeTask(taskId, previous),
      undoneTitle: undoToast?.undoneTitle ?? 'Change undone',
      silent: !undoToast,
    });
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
    persist(
      { columnId: nextColumnId, orderFraction },
      {
        title: 'Moved to',
        emphasis: columnsMap[nextColumnId]?.name ?? '',
        undoneTitle: `Back in ${columnsMap[task.columnId]?.name ?? 'its column'}`,
      },
    );
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined' || !task) return;
    const path = boardUrl({ board: project?.id ?? null, task: task.id });
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
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
    readOnly,
    canComment,
    canReact,
    canManageOwnComments,
    commentBlockedNote,
  };
}

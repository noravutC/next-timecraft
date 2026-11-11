import { toast } from 'sonner';
import { offerUndo } from '@/components/undo/offer-undo';
import { reopenColumnId } from '@/helper/utils/done-column';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import { useColumnStore } from '@/store/use-column.store';
import { useTaskStore } from '@/store/use-task.store';
import type { TaskCache } from '@/types';

type CompletableTask = Pick<
  TaskCache,
  'id' | 'title' | 'columnId' | 'orderFraction' | 'completedFromColumnId'
>;

/**
 * Mark as done / not done. Done is a place, not a second flag: the task
 * moves to the end of the board's Done column, or back where it came from.
 */
export function toggleTaskDone(task: CompletableTask): void {
  const { columns } = useColumnStore.getState();
  const projectId = columns[task.columnId]?.projectId;
  const board = Object.values(columns).filter((c) => c.projectId === projectId);
  const done = board.find((c) => c.isDone);
  if (!done) return;

  const wasDone = task.columnId === done.id;
  const targetId = wasDone
    ? reopenColumnId(board, task.completedFromColumnId)
    : done.id;
  if (!targetId) return;

  const { tasks, columnEndBound, updateTasks } = useTaskStore.getState();
  const last =
    Object.values(tasks)
      .filter((t) => t.columnId === targetId && t.id !== task.id)
      .map((t) => t.orderFraction ?? '')
      .sort()
      .at(-1) ?? null;
  const place = (columnId: string, orderFraction: string | undefined) =>
    updateTasks(
      [task.id],
      [{ id: task.id, columnId, title: task.title, orderFraction }],
    );

  place(
    targetId,
    generateFractionBetween(last, columnEndBound(targetId)),
  ).catch(() =>
    toast.error(
      wasDone ? 'Couldn’t reopen the task' : 'Couldn’t mark the task as done',
    ),
  );
  offerUndo({
    icon: 'done',
    title: wasDone ? 'Marked as not done' : 'Marked as done',
    detail: task.title,
    undo: () => place(task.columnId, task.orderFraction ?? undefined),
    undoneTitle: `Back in ${columns[task.columnId]?.name ?? 'its column'}`,
  });
}

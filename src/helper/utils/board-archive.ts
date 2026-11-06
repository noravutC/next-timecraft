import type { ArchivedTask, BoardArchive, DeletedColumn } from '@/types';
import { formatMonthDay } from './date-format';
import { shortName } from './person-name';

const byOn = (name: string | null, at: Date | string | null, now: Date) =>
  `${name ? ` by ${shortName(name)}` : ''}${at ? ` on ${formatMonthDay(new Date(at), now)}` : ''}`;

/** "From Review · archived by Mint T. on Nov 2" */
export const archivedTaskMeta = (
  task: Pick<ArchivedTask, 'columnName' | 'archivedByName' | 'archivedAt'>,
  now: Date = new Date(),
): string => {
  const rest = byOn(task.archivedByName, task.archivedAt, now);
  return rest
    ? `From ${task.columnName} · archived${rest}`
    : `From ${task.columnName}`;
};

/** "2 tasks · deleted by Noravut C. on Nov 4" */
export const deletedColumnMeta = (
  column: Pick<DeletedColumn, 'taskCount' | 'deletedByName' | 'deletedAt'>,
  now: Date = new Date(),
): string => {
  const tasks = `${column.taskCount} ${column.taskCount === 1 ? 'task' : 'tasks'}`;
  const rest = byOn(column.deletedByName, column.deletedAt, now);
  return rest ? `${tasks} · deleted${rest}` : tasks;
};

/** Tasks and columns whose name holds the query. */
export const filterArchive = (
  archive: BoardArchive,
  query: string,
): BoardArchive => {
  const q = query.trim().toLowerCase();
  if (!q) return archive;
  return {
    tasks: archive.tasks.filter((t) => t.title.toLowerCase().includes(q)),
    columns: archive.columns.filter((c) => c.name.toLowerCase().includes(q)),
  };
};

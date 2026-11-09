import type { BoardExport } from '@/db/uniq-query/project/export-utils';
import { toCsv } from '@/helper/utils/csv';
import { dayKey } from '@/helper/utils/calendar-grid';
import { zonedDay } from '@/helper/utils/time-zone';

const pad = (n: number) => String(n).padStart(2, '0');

// due dates are local midnights: the day is the one in the board's zone
const dayIn = (at: Date | string | null, timeZone: string | null) => {
  if (!at) return null;
  const { year, month, day } = zonedDay(new Date(at), timeZone ?? 'UTC');
  return `${year}-${pad(month)}-${pad(day)}`;
};

/** "website-relaunch-2026-11-07.csv": safe in any file system. */
export const exportFileName = (
  boardName: string,
  extension: 'csv' | 'json',
  now: Date = new Date(),
): string => {
  const slug =
    boardName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'board';
  return `${slug}-${dayKey(now)}.${extension}`;
};

/** The whole board as JSON: columns, then tasks with what's inside them. */
export const boardToJson = (data: BoardExport, now: Date = new Date()) => {
  const columnName = new Map(data.columns.map((c) => [c.id, c.name]));
  return JSON.stringify(
    {
      board: {
        name: data.board.name,
        timeZone: data.board.timeZone ?? 'UTC',
        description: data.board.description,
        tags: data.board.tags,
        exportedAt: now.toISOString(),
      },
      columns: data.columns.map(({ name, color, wipLimit }) => ({
        name,
        color,
        wipLimit,
      })),
      tasks: data.tasks.map(({ id: _id, columnId, ...task }) => ({
        ...task,
        column: columnName.get(columnId) ?? null,
        dueDate: dayIn(task.dueDate, data.board.timeZone),
      })),
    },
    null,
    2,
  );
};

const CSV_HEADER = [
  'Title',
  'Column',
  'Priority',
  'Labels',
  'Due date',
  'Estimate (hours)',
  'Time spent (minutes)',
  'Assignees',
  'Subtasks done',
  'Subtasks',
  'Comments',
  'Archived',
  'Created',
  'Updated',
  'Description',
];

/** One row per task; comments are counted here and written out in JSON. */
export const boardToCsv = (data: BoardExport): string => {
  const columnName = new Map(data.columns.map((c) => [c.id, c.name]));
  return toCsv(
    CSV_HEADER,
    data.tasks.map((task) => [
      task.title,
      columnName.get(task.columnId) ?? '',
      task.priority,
      task.tags.join(', '),
      dayIn(task.dueDate, data.board.timeZone),
      task.estimatedHours || null,
      task.loggedMinutes || null,
      task.assignees.join(', '),
      task.subtasks.filter((s) => s.completed).length,
      task.subtasks.length,
      task.comments.length,
      task.archived ? 'yes' : 'no',
      new Date(task.createdAt).toISOString(),
      new Date(task.updatedAt).toISOString(),
      task.description ?? '',
    ]),
  );
};

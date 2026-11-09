import type { ArchivedBoard } from '@/types';
import { formatMonthDay } from './date-format';
import { shortName } from './person-name';

const count = (n: number, word: string) =>
  `${n} ${n === 1 ? word : `${word}s`}`;

/** "Archived by Ploy S. on Oct 28 · 4 members · 23 tasks" */
export const archivedBoardMeta = (
  board: Pick<
    ArchivedBoard,
    'archivedAt' | 'archivedByName' | 'memberCount' | 'taskCount'
  >,
  now: Date = new Date(),
): string => {
  // boards archived before this was recorded have neither
  const by = board.archivedByName
    ? ` by ${shortName(board.archivedByName)}`
    : '';
  const when = board.archivedAt
    ? ` on ${formatMonthDay(new Date(board.archivedAt), now)}`
    : '';
  return [
    `Archived${by}${when}`,
    count(board.memberCount, 'member'),
    count(board.taskCount, 'task'),
  ].join(' · ');
};

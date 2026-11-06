import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import type { BoardGuest } from '@/types';
import { formatMonthDay } from './date-format';

const boards = (n: number) => `${n} ${n === 1 ? 'board' : 'boards'}`;

/** "6 boards · joined Sep 30" */
export const workspaceMemberMeta = (
  member: { boardCount: number; joinedAt: Date | string },
  now: Date = new Date(),
): string =>
  `${boards(member.boardCount)} · joined ${formatMonthDay(new Date(member.joinedAt), now)}`;

/** "Viewer on Website Relaunch", "On Launch and Roadmap", "On 3 boards" */
export const boardGuestMeta = (guest: Pick<BoardGuest, 'boards'>): string => {
  const [first, second] = guest.boards;
  if (guest.boards.length === 1) {
    return `${ROLE_LABELS[first.role]} on ${first.name}`;
  }
  if (guest.boards.length === 2) return `On ${first.name} and ${second.name}`;
  return `On ${boards(guest.boards.length)}`;
};

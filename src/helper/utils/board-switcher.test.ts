import { describe, expect, it } from 'vitest';
import { boardsToMoveTo } from './board-switcher';

const board = (
  id: string,
  role: 'owner' | 'editor' | 'viewer',
  archived = false,
) => ({ id, archived, members: [{ userId: 'me', role }] });

describe('boardsToMoveTo', () => {
  it('offers other active boards where you can add cards', () => {
    const boards = [
      board('here', 'owner'),
      board('mine', 'editor'),
      board('read-only', 'viewer'),
      board('old', 'owner', true),
    ];
    expect(boardsToMoveTo(boards, 'here', 'me').map((b) => b.id)).toEqual([
      'mine',
    ]);
  });
});

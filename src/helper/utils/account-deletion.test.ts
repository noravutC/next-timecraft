import { describe, expect, it } from 'vitest';
import { defaultDeletionChoices, ownedItemMeta } from './account-deletion';

const board = (id: string, memberCount: number, heir: string | null) => ({
  id,
  name: id,
  coverImage: null,
  settings: {},
  memberCount,
  heir: heir ? { id: heir, name: heir } : null,
});

describe('account deletion', () => {
  it('hands boards to an heir by default, and deletes the ones nobody else is on', () => {
    expect(
      defaultDeletionChoices({
        boards: [board('W', 4, 'Ploy S.'), board('H', 1, null)],
        workspace: null,
      }),
    ).toEqual({ boards: { W: 'transfer', H: 'delete' }, workspace: undefined });
  });

  it('says what happens to each thing you own', () => {
    expect(ownedItemMeta(board('W', 4, 'Ploy S.'), 'transfer', 'board')).toBe(
      '4 members · Ploy S. becomes the owner',
    );
    expect(ownedItemMeta(board('W', 4, 'Ploy S.'), 'delete', 'board')).toBe(
      '4 members · deleted with its tasks',
    );
    expect(ownedItemMeta(board('H', 1, null), 'delete', 'board')).toBe(
      'Only you · deleted with its tasks',
    );
    expect(ownedItemMeta(board('N', 3, 'Ploy S.'), 'delete', 'workspace')).toBe(
      '3 members · deleted for everyone',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { pickHeir } from './heir';

const m = (
  userId: string,
  role: 'owner' | 'admin' | 'editor' | 'viewer',
  joined: string,
) => ({
  userId,
  role,
  joinedAt: new Date(joined),
});

describe('pickHeir', () => {
  it('hands over to the highest role, never to the one leaving', () => {
    const heir = pickHeir(
      [
        m('me', 'owner', '2026-01-01'),
        m('ed', 'editor', '2026-01-02'),
        m('ad', 'admin', '2026-03-01'),
      ],
      'me',
    );
    expect(heir?.userId).toBe('ad');
  });

  it('breaks a tie by who joined first', () => {
    const heir = pickHeir(
      [m('late', 'editor', '2026-05-01'), m('early', 'editor', '2026-02-01')],
      'me',
    );
    expect(heir?.userId).toBe('early');
  });

  it('finds nobody when the owner is alone', () => {
    expect(pickHeir([m('me', 'owner', '2026-01-01')], 'me')).toBeNull();
  });
});

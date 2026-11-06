import { describe, expect, it } from 'vitest';
import { invitesSummary } from './invite-result';

const invitation = (email: string) => ({
  id: email,
  email,
  role: 'member' as const,
  token: 't',
  expiresAt: new Date(),
  createdAt: new Date(),
});

describe('invitesSummary', () => {
  it('counts what went out', () => {
    expect(
      invitesSummary({ invited: [invitation('a@x.com')], skipped: [] }),
    ).toBe('1 invitation sent');
    expect(
      invitesSummary({
        invited: [invitation('a@x.com'), invitation('b@x.com')],
        skipped: [],
      }),
    ).toBe('2 invitations sent');
  });

  it('says who was left out and why', () => {
    expect(
      invitesSummary({
        invited: [invitation('a@x.com')],
        skipped: [{ email: 'me@x.com', reason: 'Already in this workspace' }],
      }),
    ).toBe(
      '1 invitation sent. Not invited: me@x.com (Already in this workspace)',
    );
  });

  it('has nothing to say about an empty batch', () => {
    expect(invitesSummary({ invited: [], skipped: [] })).toBeNull();
  });
});

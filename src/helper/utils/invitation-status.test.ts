import { describe, it, expect } from 'vitest';
import { invitationStatus } from './invitation-status';

const NOW = new Date('2026-07-07T12:00:00Z');
const FUTURE = new Date('2026-07-14T12:00:00Z');
const PAST = new Date('2026-07-01T12:00:00Z');

const base = { acceptedAt: null, revokedAt: null, expiresAt: FUTURE };

describe('invitationStatus', () => {
  it('is pending when untouched and not expired', () => {
    expect(invitationStatus(base, NOW)).toBe('pending');
  });

  it('is expired when expiresAt has passed', () => {
    expect(invitationStatus({ ...base, expiresAt: PAST }, NOW)).toBe('expired');
  });

  it('treats expiresAt exactly at now as expired', () => {
    expect(invitationStatus({ ...base, expiresAt: NOW }, NOW)).toBe('expired');
  });

  it('is accepted when acceptedAt is set, even after expiry', () => {
    expect(
      invitationStatus({ ...base, acceptedAt: PAST, expiresAt: PAST }, NOW),
    ).toBe('accepted');
  });

  it('revoked wins over accepted and expired', () => {
    expect(
      invitationStatus(
        { acceptedAt: PAST, revokedAt: PAST, expiresAt: PAST },
        NOW,
      ),
    ).toBe('revoked');
  });
});

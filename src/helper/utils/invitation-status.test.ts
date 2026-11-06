import { describe, it, expect } from 'vitest';
import {
  invitationExpiryLabel,
  invitationStatus,
  inviteeInitials,
} from './invitation-status';

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

describe('invitationExpiryLabel', () => {
  const HOUR = 60 * 60 * 1000;
  const at = (hours: number) => new Date(NOW.getTime() + hours * HOUR);

  it('counts whole days left', () => {
    expect(invitationExpiryLabel(at(6 * 24 + 5), NOW)).toBe(
      'expires in 6 days',
    );
    expect(invitationExpiryLabel(at(30), NOW)).toBe('expires in 1 day');
  });

  it('says less than a day for the last hours', () => {
    expect(invitationExpiryLabel(at(3), NOW)).toBe(
      'expires in less than a day',
    );
  });

  it('reads expired once the time has passed', () => {
    expect(invitationExpiryLabel(at(-1), NOW)).toBe('expired');
  });
});

describe('inviteeInitials', () => {
  it('reads initials from the address before the @', () => {
    expect(inviteeInitials('jane.lee@example.com')).toBe('JL');
    expect(inviteeInitials('ploy@example.com')).toBe('P');
  });
});

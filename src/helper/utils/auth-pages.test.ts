import { describe, expect, it } from 'vitest';
import { appendEmail } from './email-list';
import { firstImageFile } from './image-file';
import { inviteView } from './invite-view';
import { signInDestination } from './sign-in-destination';

describe('signInDestination', () => {
  it('sends users with a workspace to their boards', () => {
    expect(
      signInDestination({ organizationId: 'org-1', canCreateOrg: true }),
    ).toBe('/project');
  });
  it('sends users without a workspace to setup when they may create one', () => {
    expect(signInDestination({ organizationId: '', canCreateOrg: true })).toBe(
      '/organization/create',
    );
  });
  it('sends members who cannot create a workspace to their boards', () => {
    expect(signInDestination({ organizationId: '', canCreateOrg: false })).toBe(
      '/project',
    );
  });
});

describe('inviteView', () => {
  const pending = { status: 'pending' as const, emailMatches: true };

  it('waits for the session, then asks signed-out visitors to sign in', () => {
    expect(
      inviteView({ sessionStatus: 'loading', hasError: false, preview: null }),
    ).toBe('checking-session');
    expect(
      inviteView({
        sessionStatus: 'unauthenticated',
        hasError: false,
        preview: null,
      }),
    ).toBe('signed-out');
  });

  it('shows not-found on error and loading until the preview arrives', () => {
    const base = { sessionStatus: 'authenticated' as const };
    expect(inviteView({ ...base, hasError: true, preview: null })).toBe(
      'not-found',
    );
    expect(inviteView({ ...base, hasError: false, preview: null })).toBe(
      'loading-preview',
    );
  });

  it('checks the account before revealing the invitation state', () => {
    expect(
      inviteView({
        sessionStatus: 'authenticated',
        hasError: false,
        preview: { status: 'expired', emailMatches: false },
      }),
    ).toBe('wrong-account');
  });

  it('maps each status to its card', () => {
    const view = (status: 'pending' | 'accepted' | 'revoked' | 'expired') =>
      inviteView({
        sessionStatus: 'authenticated',
        hasError: false,
        preview: { ...pending, status },
      });
    expect(view('pending')).toBe('valid');
    expect(view('accepted')).toBe('accepted');
    expect(view('revoked')).toBe('revoked');
    expect(view('expired')).toBe('expired');
  });
});

describe('firstImageFile', () => {
  const file = (name: string, type: string) => new File(['x'], name, { type });

  it('picks the first image and skips other files', () => {
    const logo = file('logo.svg', 'image/svg+xml');
    expect(firstImageFile([file('notes.txt', 'text/plain'), logo])).toBe(logo);
  });
  it('returns null when nothing is an image', () => {
    expect(firstImageFile([file('a.pdf', 'application/pdf')])).toBeNull();
    expect(firstImageFile(null)).toBeNull();
  });
});

describe('appendEmail', () => {
  it('normalises and appends a new email', () => {
    expect(appendEmail(['a@x.com'], '  Ploy@Example.com ')).toEqual([
      'a@x.com',
      'ploy@example.com',
    ]);
  });
  it('rejects blanks, non-emails and duplicates', () => {
    expect(appendEmail([], '   ')).toBeNull();
    expect(appendEmail([], 'ploy')).toBeNull();
    expect(appendEmail(['ploy@example.com'], 'PLOY@example.com')).toBeNull();
  });
});

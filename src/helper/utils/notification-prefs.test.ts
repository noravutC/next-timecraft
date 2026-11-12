import { describe, expect, it } from 'vitest';
import {
  mergePrefs,
  wantsEmail,
  wantsInApp,
  withPrefDefaults,
} from './notification-prefs';

describe('notification preferences', () => {
  it('a rule’s notices arrive in the app, and by email only when asked', () => {
    const prefs = withPrefDefaults({});
    expect(wantsInApp(prefs, 'automation')).toBe(true);
    expect(wantsEmail(prefs, 'automation')).toBe(false);
    expect(
      wantsEmail(
        withPrefDefaults({ kinds: { automation: { email: true } } }),
        'automation',
      ),
    ).toBe(true);
  });

  it('starts from sensible defaults', () => {
    const prefs = withPrefDefaults({});
    expect(wantsInApp(prefs, 'comment_reply')).toBe(true);
    expect(wantsEmail(prefs, 'comment_reply')).toBe(false);
    expect(wantsEmail(prefs, 'comment_mention')).toBe(true);
  });

  it('turns kinds off, and the master switch silences every email', () => {
    const prefs = withPrefDefaults({
      email: false,
      kinds: { mentions: { app: false } },
    });
    expect(wantsInApp(prefs, 'comment_mention')).toBe(false);
    expect(wantsEmail(prefs, 'task_assigned')).toBe(false);
  });

  it('always delivers invitations', () => {
    const prefs = withPrefDefaults({
      email: false,
      kinds: { invites: { app: false, email: false } },
    });
    expect(wantsInApp(prefs, 'board_invite')).toBe(true);
    expect(wantsEmail(prefs, 'workspace_invite')).toBe(true);
  });

  it('merges one change into what was saved', () => {
    expect(
      mergePrefs(
        { kinds: { mentions: { email: false } } },
        { kinds: { mentions: { app: false } } },
      ),
    ).toEqual({ kinds: { mentions: { email: false, app: false } } });
  });
});

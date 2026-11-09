import type { NotificationRow } from '@/types';

/** The rows of Settings › Notifications. */
export const PREF_KINDS = [
  'mentions',
  'replies',
  'assigned',
  'due',
  'invites',
  'roles',
  'accepted',
] as const;

export type PrefKind = (typeof PREF_KINDS)[number];
export type Channels = { app: boolean; email: boolean };

export type NotificationPrefs = {
  /** the master switch for every email except invitations */
  email: boolean;
  kinds: Record<PrefKind, Channels>;
};

/** What's saved: only what someone changed. */
export type StoredNotificationPrefs = {
  email?: boolean;
  kinds?: Partial<Record<PrefKind, Partial<Channels>>>;
};

export const DEFAULT_PREFS: NotificationPrefs = {
  email: true,
  kinds: {
    mentions: { app: true, email: true },
    replies: { app: true, email: false },
    assigned: { app: true, email: true },
    due: { app: true, email: true },
    invites: { app: true, email: true },
    roles: { app: true, email: false },
    accepted: { app: true, email: false },
  },
};

/** Invitations always arrive both ways: they're how people get in at all. */
export const isFixedKind = (kind: PrefKind) => kind === 'invites';

export const withPrefDefaults = (
  stored: StoredNotificationPrefs | null | undefined,
): NotificationPrefs => ({
  email: stored?.email ?? DEFAULT_PREFS.email,
  kinds: Object.fromEntries(
    PREF_KINDS.map((kind) => [
      kind,
      isFixedKind(kind)
        ? DEFAULT_PREFS.kinds[kind]
        : { ...DEFAULT_PREFS.kinds[kind], ...stored?.kinds?.[kind] },
    ]),
  ) as Record<PrefKind, Channels>,
});

const KIND_OF: Record<NotificationRow['type'], PrefKind> = {
  comment_mention: 'mentions',
  comment_reply: 'replies',
  task_assigned: 'assigned',
  board_invite: 'invites',
  workspace_invite: 'invites',
  member_removed: 'roles',
  role_changed: 'roles',
  invite_accepted: 'accepted',
};

/** The settings row a notification type belongs to. */
export const prefKindOf = (type: NotificationRow['type']): PrefKind =>
  KIND_OF[type];

export const wantsInApp = (
  prefs: NotificationPrefs,
  type: NotificationRow['type'],
): boolean => prefs.kinds[prefKindOf(type)].app;

export const wantsEmail = (
  prefs: NotificationPrefs,
  type: NotificationRow['type'],
): boolean => {
  const kind = prefKindOf(type);
  return isFixedKind(kind) || (prefs.email && prefs.kinds[kind].email);
};

/** A saved change on top of what was saved before (kinds merge one by one). */
export const mergePrefs = (
  stored: StoredNotificationPrefs,
  patch: StoredNotificationPrefs,
): StoredNotificationPrefs => {
  const kinds = { ...stored.kinds };
  for (const [kind, channels] of Object.entries(patch.kinds ?? {})) {
    kinds[kind as PrefKind] = { ...kinds[kind as PrefKind], ...channels };
  }
  return {
    ...stored,
    ...(patch.email === undefined ? {} : { email: patch.email }),
    kinds,
  };
};

/** Each row of Settings › Notifications: its name and what it covers. */
export const PREF_KIND_COPY: Record<PrefKind, { label: string; hint: string }> =
  {
    mentions: {
      label: 'Mentions',
      hint: 'Someone @mentions you in a comment.',
    },
    replies: {
      label: 'Replies',
      hint: 'New comments on a task you’ve commented on or are assigned to.',
    },
    assigned: { label: 'Assigned to you', hint: 'Someone adds you to a task.' },
    due: {
      label: 'Due date reminders',
      hint: 'A task of yours is due the next day.',
    },
    invites: {
      label: 'Invitations',
      hint: 'Someone invites you to a board or a workspace.',
    },
    roles: {
      label: 'Role changes and removals',
      hint: 'Your role on a board changes, or you’re removed.',
    },
    accepted: {
      label: 'Invitation accepted',
      hint: 'Someone joins through an invitation you sent.',
    },
  };

// The demo board every "Continue as guest" visitor lands on. Mirrors the
// redesign prototype so the board shows every card state (labels, due dates,
// subtasks, comments). Dates are offsets from the reset day.

export const DEMO_BOARD_NAME = 'Website Relaunch';
export const DEMO_BOARD_DESCRIPTION =
  'Shared demo board. Anything you change here is visible to other guests and resets every night.';
/** violet accent: the board tile reads as the prototype's lavender "W" */
export const DEMO_BOARD_COLOR = '#8b5cf6';

export const DEMO_LABELS: Record<string, string> = {
  Content: '#ec4899',
  Design: '#8b5cf6',
  A11y: '#06b6d4',
  Research: '#64748b',
  Infra: '#3b82f6',
  Product: '#10b981',
  Auth: '#f59e0b',
  Bug: '#ef4444',
  Realtime: '#06b6d4',
  Backend: '#3b82f6',
  Performance: '#10b981',
};

export const DEMO_COLUMNS = [
  { name: 'Backlog', color: '#a3a3a3' },
  { name: 'To do', color: '#3b82f6' },
  { name: 'In progress', color: '#f59e0b' },
  { name: 'Review', color: '#8b5cf6' },
  { name: 'Done', color: '#10b981' },
] as const;

export type DemoCard = {
  column: (typeof DEMO_COLUMNS)[number]['name'];
  title: string;
  labels: string[];
  priority: 'low' | 'medium' | 'high';
  /** days from the reset day; null = no due date */
  dueInDays: number | null;
  /** [title, done] */
  subtasks?: [string, boolean][];
  comments?: string[];
  assigned: boolean;
  description?: string;
  /** days before the reset day it was created (default: that day) */
  createdDaysAgo?: number;
  /** days before the reset day it moved into its column (default: never) */
  movedDaysAgo?: number;
  /** the title of a card this one waits on */
  blockedBy?: string;
};

export const DEMO_CARDS: DemoCard[] = [
  {
    column: 'Backlog',
    title: 'Draft pricing page copy',
    createdDaysAgo: 9,
    labels: ['Content'],
    priority: 'low',
    dueInDays: null,
    assigned: true,
  },
  {
    column: 'Backlog',
    title: 'Audit color contrast across the app',
    createdDaysAgo: 3,
    labels: ['Design', 'A11y'],
    priority: 'medium',
    dueInDays: 14,
    assigned: true,
  },
  {
    column: 'Backlog',
    title: 'Explore a calendar view for due dates',
    createdDaysAgo: 16,
    labels: ['Research'],
    priority: 'low',
    dueInDays: null,
    assigned: false,
  },
  {
    column: 'To do',
    title: 'Set up Resend domain for invite emails',
    createdDaysAgo: 6,
    labels: ['Infra'],
    priority: 'medium',
    dueInDays: 1,
    assigned: true,
    comments: [
      'DNS records are in, waiting for verification.',
      'Verified. Sending from invite@ works now.',
    ],
  },
  {
    column: 'To do',
    title: 'Onboarding checklist for new boards',
    createdDaysAgo: 5,
    blockedBy: 'Set up Resend domain for invite emails',
    labels: ['Product'],
    priority: 'medium',
    dueInDays: null,
    assigned: true,
    subtasks: [
      ['List the first five actions', false],
      ['Write the empty-board copy', false],
      ['Link the checklist from the first board', false],
      ['Track which steps get done', false],
    ],
  },
  {
    column: 'To do',
    title: 'Brief for empty-state illustrations',
    createdDaysAgo: 1,
    labels: ['Design'],
    priority: 'low',
    dueInDays: 12,
    assigned: true,
  },
  {
    column: 'In progress',
    title: 'Migrate sign-in to Auth.js v5',
    // moved within the week: older than that it would count as stuck
    createdDaysAgo: 13,
    movedDaysAgo: 4,
    labels: ['Auth', 'Infra'],
    priority: 'high',
    dueInDays: 6,
    assigned: true,
    description:
      'Replace next-auth v4 with Auth.js v5. Keep Google OAuth and the guest provider, move session checks to auth(), and confirm the production callback URL before switching over.',
    subtasks: [
      ['Swap getServerSession for auth() in API handlers', true],
      ['Update the Google OAuth callback URL', true],
      ['End-to-end test for guest sign-in', false],
      ['Remove next-auth v4 type augmentations', false],
    ],
    comments: [
      'Callback works on staging. The guest provider still needs `trustHost` on the EC2 box.',
      'Added it. The new sign-in screen is live on staging.',
      'Can we keep the 48 hour session length after the switch?',
    ],
  },
  {
    column: 'In progress',
    title: 'Fix drag preview offset in Safari',
    createdDaysAgo: 6,
    movedDaysAgo: 2,
    labels: ['Bug'],
    priority: 'high',
    dueInDays: -1,
    assigned: true,
    comments: [
      'Reproduced on Safari 18: the preview jumps by the scroll offset.',
      'Only happens when the board is scrolled horizontally.',
      'Fix is to skip the custom native preview on Safari.',
      'Confirmed fixed on Safari and Chrome.',
    ],
  },
  {
    column: 'In progress',
    title: 'Command menu for switching boards',
    createdDaysAgo: 8,
    movedDaysAgo: 1,
    labels: ['Product'],
    priority: 'medium',
    dueInDays: 3,
    assigned: true,
    subtasks: [
      ['Open with Cmd or Ctrl + K', true],
      ['Search boards by name', false],
      ['Keyboard navigation', false],
    ],
    comments: ['Should the menu also run actions like Create board?'],
  },
  {
    column: 'Review',
    title: 'Realtime presence on cards',
    // in Review for over a week: Insights lists it as stuck
    createdDaysAgo: 14,
    movedDaysAgo: 9,
    labels: ['Realtime'],
    priority: 'medium',
    dueInDays: null,
    assigned: true,
    subtasks: [
      ['Track who has a card open', true],
      ['Show avatars on the open card', true],
      ['Clear presence on disconnect', true],
    ],
    comments: [
      'Presence uses the private project channel.',
      'Avatars show within a second of opening a card.',
      'What happens on a flaky connection?',
      'Presence clears after the socket times out.',
      'Looks good in two browsers side by side.',
      'Ready to merge.',
    ],
  },
  {
    column: 'Review',
    title: 'Rate limit the AI breakdown endpoint',
    createdDaysAgo: 11,
    movedDaysAgo: 8,
    labels: ['Backend'],
    priority: 'medium',
    dueInDays: null,
    assigned: true,
  },
  {
    column: 'Done',
    title: 'Lazy-load columns, 20 cards per page',
    createdDaysAgo: 5,
    movedDaysAgo: 0,
    labels: ['Performance'],
    priority: 'medium',
    dueInDays: null,
    assigned: true,
    subtasks: [
      ['Cursor pagination in the API', true],
      ['Load more when the list nears the end', true],
      ['Keep drag-and-drop working across pages', true],
      ['Test with 500 cards', true],
    ],
  },
  {
    column: 'Done',
    title: 'Build images on GitHub Actions',
    createdDaysAgo: 2,
    movedDaysAgo: 0,
    labels: ['Infra'],
    priority: 'low',
    dueInDays: null,
    assigned: true,
  },
  {
    column: 'Done',
    title: 'Comment attachments with previews',
    createdDaysAgo: 4,
    movedDaysAgo: 0,
    labels: ['Product'],
    priority: 'medium',
    dueInDays: null,
    assigned: true,
    comments: [
      'Images and short videos upload straight to storage.',
      'Previews render in the comment list.',
    ],
  },
];

/** The columns a card passes through before Done, in order. */
export const DEMO_LANES = [
  'Backlog',
  'To do',
  'In progress',
  'Review',
] as const;

/**
 * Work finished in earlier weeks, archived so the board stays short. The
 * Insights view draws its chart, its medians and "Time in each column" from
 * it. Each row: title, days before the reset day it was finished, the days
 * it spent in Backlog, To do, In progress and Review (0 = skipped), then
 * its due date as days after the day it was finished (negative = finished
 * late; left out = no due date).
 */
export const DEMO_HISTORY: [
  title: string,
  doneDaysAgo: number,
  backlog: number,
  todo: number,
  inProgress: number,
  review: number,
  dueAfterDone?: number,
][] = [
  ['Set up the Next.js app and CI', 80, 0.5, 0.5, 2, 1, 2],
  ['Sign in with Google', 79, 1, 0.5, 2.5, 1.5, 1],
  ['Board and column schema', 78, 0.5, 1, 1.5, 2],
  ['Create and rename columns', 73, 1, 0.5, 1, 1, 3],
  ['Drag cards between columns', 72, 1.5, 0.5, 3, 2.5, -2],
  ['Card ordering that survives a reload', 71, 1, 1, 2, 1.5, 1],
  ['Task sheet with description', 70, 0.5, 0.5, 2, 2, 2],
  ['Due dates on cards', 66, 2, 0.5, 1, 1, 0],
  ['Labels and label colors', 64, 1, 0.5, 1.5, 2],
  ['Invite people by email', 59, 1.5, 1, 2.5, 3, -1],
  ['Roles for board members', 58, 1, 0.5, 2, 2.5, 2],
  ['Realtime updates between browsers', 57, 2, 1, 3, 2, 1],
  ['Comments on tasks', 56, 0.5, 0.5, 1.5, 1.5, 3],
  ['Mentions in comments', 55, 1, 0.5, 1, 2],
  ['Notification bell', 50, 1, 1, 1.5, 1, 1],
  ['Subtasks with progress', 45, 0.5, 0.5, 1.5, 2, 2],
  ['Filter the board by label and person', 44, 1.5, 0.5, 2, 2.5, -3],
  ['Search across boards', 43, 1, 1, 2, 1.5, 1],
  ['Archive and restore tasks', 42, 0.5, 0.5, 1, 1],
  ['Board settings dialog', 38, 1, 0.5, 1.5, 2, 2],
  ['Task history', 37, 2, 0.5, 1.5, 1.5, 0],
  ['Due date reminders', 36, 1, 1, 2, 3, -1],
  ['Calendar view', 31, 1.5, 0.5, 2.5, 2, 1],
  ['Calendar feed for other apps', 30, 0.5, 0.5, 1, 1.5],
  ['Time tracking on tasks', 29, 1, 0.5, 2, 2, 2],
  ['Export a board as CSV', 28, 0.5, 0.5, 0.5, 1, 3],
  ['Undo for moves and archives', 24, 1, 1, 1.5, 2.5, -2],
  ['Keyboard shortcuts', 22, 0.5, 0.5, 1, 1],
  ['Task dependencies', 17, 1.5, 0.5, 2, 2, 1],
  ['Done column and the finished tick', 16, 1, 0.5, 2, 1.5, 2],
  ['Faster first page of the board', 15, 0.5, 0.5, 1, 1],
  ['Board search with an index', 14, 1, 0.5, 1.5, 2, 1],
  ['Sentry and traces for the API', 10, 1, 0.5, 2, 1.5, 2],
  ['Accessibility checks in CI', 9, 0.5, 0.5, 1.5, 2, 0],
  ['Rollback in the deploy script', 8, 1, 0.5, 1, 1.5, 1],
];

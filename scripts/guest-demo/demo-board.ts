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
};

export const DEMO_CARDS: DemoCard[] = [
  {
    column: 'Backlog',
    title: 'Draft pricing page copy',
    labels: ['Content'],
    priority: 'low',
    dueInDays: null,
    assigned: true,
  },
  {
    column: 'Backlog',
    title: 'Audit color contrast across the app',
    labels: ['Design', 'A11y'],
    priority: 'medium',
    dueInDays: 14,
    assigned: true,
  },
  {
    column: 'Backlog',
    title: 'Explore a calendar view for due dates',
    labels: ['Research'],
    priority: 'low',
    dueInDays: null,
    assigned: false,
  },
  {
    column: 'To do',
    title: 'Set up Resend domain for invite emails',
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
    labels: ['Design'],
    priority: 'low',
    dueInDays: 12,
    assigned: true,
  },
  {
    column: 'In progress',
    title: 'Migrate sign-in to Auth.js v5',
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
    labels: ['Product'],
    priority: 'medium',
    dueInDays: null,
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
    labels: ['Backend'],
    priority: 'medium',
    dueInDays: null,
    assigned: true,
  },
  {
    column: 'Done',
    title: 'Lazy-load columns, 20 cards per page',
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
    labels: ['Infra'],
    priority: 'low',
    dueInDays: null,
    assigned: true,
  },
  {
    column: 'Done',
    title: 'Comment attachments with previews',
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

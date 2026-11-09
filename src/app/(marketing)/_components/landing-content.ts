import type { Tone } from '@/helper/utils/avatar-tone';
import type { NumberedItem } from './numbered-grid';

/* Copy and data for the product page (/timecraft). Billing is not live:
   the tiers are labelled as plans, and every feature is free today. */

export const LANDING_NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Pricing', href: '#pricing' },
];

export const FOOTER_NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Sign in', href: '/login' },
];

// the phone menu works from any marketing page, so its links are absolute
export const MOBILE_MENU: { label: string; href: string; badge?: string }[] = [
  { label: 'Features', href: '/timecraft#features' },
  {
    label: 'Integrations',
    href: '/timecraft#integrations',
    badge: 'More coming',
  },
  { label: 'Pricing', href: '/timecraft#pricing' },
  { label: 'Privacy', href: '/privacy' },
];

export const LEGAL_FOOTER_NAV = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Sign in', href: '/login' },
];

// ---- product preview (decorative board mock) ----

export interface PreviewPerson {
  initials: string;
  tone: Tone;
}

const NC: PreviewPerson = { initials: 'NC', tone: 'violet' };
const PS: PreviewPerson = { initials: 'PS', tone: 'green' };
const AK: PreviewPerson = { initials: 'AK', tone: 'orange' };

export const PREVIEW_TEAM = [NC, PS, AK];

export interface PreviewCard {
  title: string;
  tag: string;
  tagColor: string;
  who: PreviewPerson;
}

export interface PreviewColumn {
  name: string;
  color: string;
  cards: PreviewCard[];
}

export const PREVIEW_COLUMNS: PreviewColumn[] = [
  {
    name: 'To do',
    color: '#3B82F6',
    cards: [
      {
        title: 'Set up Resend domain for invites',
        tag: 'Infra',
        tagColor: '#3B82F6',
        who: NC,
      },
      {
        title: 'Onboarding checklist',
        tag: 'Product',
        tagColor: '#10B981',
        who: PS,
      },
    ],
  },
  {
    name: 'In progress',
    color: '#F59E0B',
    cards: [
      {
        title: 'Migrate sign-in to Auth.js v5',
        tag: 'Auth',
        tagColor: '#F59E0B',
        who: NC,
      },
      {
        title: 'Fix drag preview in Safari',
        tag: 'Bug',
        tagColor: '#EF4444',
        who: AK,
      },
    ],
  },
  {
    name: 'Review',
    color: '#8B5CF6',
    cards: [
      {
        title: 'Realtime presence on cards',
        tag: 'Realtime',
        tagColor: '#06B6D4',
        who: AK,
      },
    ],
  },
  {
    name: 'Done',
    color: '#10B981',
    cards: [
      {
        title: 'Lazy-load columns',
        tag: 'Performance',
        tagColor: '#10B981',
        who: NC,
      },
      {
        title: 'Comment attachments',
        tag: 'Product',
        tagColor: '#10B981',
        who: PS,
      },
    ],
  },
];

// ---- features and steps ----

export const FEATURES: NumberedItem[] = [
  {
    no: '01',
    title: 'Boards that keep their order',
    body: 'Drag cards and whole columns exactly where you want them. Drops are smooth with auto-scroll, and the order stays put even when the whole team is rearranging at once.',
  },
  {
    no: '02',
    title: 'AI that breaks down the big stuff',
    body: 'Describe a goal and AI Breakdown splits it into concrete tasks, streamed onto your board in seconds. Works with Claude or Gemini using your own key.',
  },
  {
    no: '03',
    title: 'Changes land in real time',
    body: 'Boards sync over websockets. Move a card and every teammate sees it instantly, with no refresh and no working off a stale plan.',
  },
  {
    no: '04',
    title: 'Everything a task needs',
    body: 'Priorities, due dates, labels, assignees, subtasks and estimates, plus comments with attachments and reactions, and notifications so nothing slips past.',
  },
];

export const STEPS: NumberedItem[] = [
  {
    no: '01',
    title: 'Set up your board',
    body: 'Sign in with Google, or jump in as a guest with no account. Pick a template and your columns are ready.',
  },
  {
    no: '02',
    title: 'Work it together',
    body: 'Drag cards as work moves, assign teammates, set priorities and due dates, and talk it out in comments on the task.',
  },
  {
    no: '03',
    title: 'Let AI unblock you',
    body: 'Hand a fuzzy goal to AI Breakdown and get clear tasks back in seconds, right where your team already works.',
  },
];

// Calendar is the board's iCal feed (Calendar view › Subscribe)
export const INTEGRATIONS: { name: string; live?: boolean }[] = [
  { name: 'Calendar', live: true },
  { name: 'Slack' },
  { name: 'Notion' },
  { name: 'GitHub' },
  { name: 'Figma' },
  { name: 'Stripe' },
  { name: 'Zapier' },
  { name: 'Toggl' },
];

// ---- pricing (planned, not live) ----

export interface PricingTier {
  name: string;
  tagline: string;
  /** USD per month; 0 = free forever */
  monthly: number;
  annual: number;
  perSeat: boolean;
  featured: boolean;
  planned: boolean;
  perks: string[];
}

export const TIERS: PricingTier[] = [
  {
    name: 'Solo',
    tagline: 'For getting one project off the ground.',
    monthly: 0,
    annual: 0,
    perSeat: false,
    featured: false,
    planned: false,
    perks: [
      '1 project board',
      'Full kanban with comments',
      'AI breakdown, limited runs',
      'Real-time collaboration',
    ],
  },
  {
    name: 'Pro',
    tagline: 'For the freelancer running several projects.',
    monthly: 12,
    annual: 9,
    perSeat: false,
    featured: true,
    planned: true,
    perks: [
      'Unlimited boards',
      'Unlimited AI breakdowns',
      'Integrations, when they land',
      'Priority support',
    ],
  },
  {
    name: 'Studio',
    tagline: 'For small teams sharing boards and clients.',
    monthly: 24,
    annual: 19,
    perSeat: true,
    featured: false,
    planned: true,
    perks: [
      'Everything in Pro',
      'Shared team workspaces',
      'Roles and permissions controls',
      'Usage and project reports',
    ],
  },
];

/** "$9" + "/mo, billed yearly" for the chosen billing period. */
export const tierPrice = (tier: PricingTier, annual: boolean) => {
  if (tier.monthly === 0) return { price: '$0', unit: 'forever' };
  const amount = annual ? tier.annual : tier.monthly;
  const unit = tier.perSeat
    ? annual
      ? 'per seat /mo, yearly'
      : 'per seat /mo'
    : annual
      ? '/mo, billed yearly'
      : '/mo, billed monthly';
  return { price: `$${amount}`, unit };
};

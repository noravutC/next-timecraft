import type { NumberedItem } from '../numbered-grid';
import type { ColumnKey } from './case-study-operations';

/* Copy and data for the case-study page (/). */

export const GITHUB_URL = 'https://github.com/noravutC';
export const LINKEDIN_URL =
  'https://www.linkedin.com/in/noravut-chanthalay-2396672b6/';
export const EMAIL = 'noravut.ch@gmail.com';

export const CASE_STUDY_NAV = [
  { label: 'Interaction', href: '#board' },
  { label: 'Optimistic UI', href: '#sync' },
  { label: 'Decisions', href: '#decisions' },
  { label: 'Contact', href: '#contact' },
];

export const LANES: Record<
  ColumnKey,
  { name: string; color: string; cards: string[] }
> = {
  backlog: {
    name: 'BACKLOG',
    color: '#A3A3A3',
    cards: ['Rate-limit the sync endpoint', 'Dark mode for the board view'],
  },
  doing: {
    name: 'DOING',
    color: '#F59E0B',
    cards: ['Presence cursors on card hover'],
  },
  done: {
    name: 'DONE',
    color: '#10B981',
    cards: ['Board keyboard shortcuts'],
  },
};

export const DECISIONS: NumberedItem[] = [
  {
    no: '01',
    title: 'One hero moment, not scattered fades',
    body: 'All motion budget goes to the draggable card, the product’s core verb. Scroll reveals appear only where they explain sequence, and reduced motion is respected end to end.',
  },
  {
    no: '02',
    title: 'Hairlines, not decoration',
    body: 'Structure comes from 1px borders and spacing instead of gradients and glows, so the cards themselves stay the most colorful thing on screen.',
  },
  {
    no: '03',
    title: 'Monochrome UI, one brand accent',
    body: 'Geist for interface text, Geist Mono for counts, IDs and timestamps. Black for primary actions; TimeCraft violet only for the brand, focus and AI.',
  },
];

export const ENGINEERING = [
  {
    title: 'Fractional indexing',
    body: 'A card move writes one row, not a renumbered column: each card keys into a fraction string between its neighbours. The same scheme orders columns and tasks.',
  },
  {
    title: 'Optimistic UI and rollback',
    body: 'Every mutation snapshots the store, applies instantly, and reverts if the API call fails. The snapshot-and-revert cycle is unit-tested.',
  },
  {
    title: 'Multi-tenant RBAC',
    body: 'Permissions are a typed union mapped to role sets, enforced at the API layer through a single authorize() gate, with no ad-hoc role checks in routes.',
  },
  {
    title: 'AI task breakdown',
    body: 'A goal streams back from the model over SSE, one subtask per line. Each line is validated with Zod before it ever reaches the board.',
  },
  {
    title: 'Owned deploy path',
    body: 'GitHub Actions builds a multi-stage Docker image and pushes it to GHCR; an EC2 box pulls it behind Caddy auto-HTTPS, tuned for a memory-constrained instance.',
  },
];

export const ABOUT_TAGS = [
  'interaction design',
  'motion engineering',
  'design systems',
];

/* Pure logic for the case-study page: spring drag for the hero card and the
   optimistic-UI timeline. Kept out of the render files. */

export type ColumnKey = 'backlog' | 'doing' | 'done';
export type SyncState = 'synced' | 'pending';
export type Vec = { x: number; y: number };
export type Slot = { x: number; y: number; w: number; h: number };
export type Slots = Partial<Record<ColumnKey, Slot>>;

export const COLUMN_KEYS = ['backlog', 'doing', 'done'] as const;

export const SYNC_DELAY_MS = 450;
export const NUDGE_INTERVAL_MS = 7000;
export const INIT_MEASURE_DELAY_MS = 120;
export const DEMO_IO_THRESHOLD = 0.3;

const SPRING_K = 0.11;
const SPRING_DAMP = 0.82;
const DRAG_FOLLOW_BASE = 0.72;
const TILT_CLAMP_DEG = 6;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clampTilt = (v: number) =>
  Math.max(-TILT_CLAMP_DEG, Math.min(TILT_CLAMP_DEG, v));

/* ---------- hero-card physics ---------- */

/** Exponential pointer-follow while dragging: f = 1 - 0.72^(dt*3). Mutates pos/vel, returns tilt deg. */
export function dragStep(
  pos: Vec,
  vel: Vec,
  target: Vec,
  dt: number,
  reduced: boolean,
): number {
  const f = reduced ? 1 : 1 - Math.pow(DRAG_FOLLOW_BASE, dt * 3);
  const dx = (target.x - pos.x) * f;
  const dy = (target.y - pos.y) * f;
  vel.x = dx / dt;
  vel.y = dy / dt;
  pos.x += dx;
  pos.y += dy;
  return reduced ? 0 : clampTilt(vel.x * 0.6);
}

/** Spring integration toward target (k=0.11, damp=0.82). Mutates pos/vel; returns tilt deg, or null when settled. */
export function springStep(
  pos: Vec,
  vel: Vec,
  target: Vec,
  dt: number,
): number | null {
  const k = SPRING_K * dt;
  const damp = Math.pow(SPRING_DAMP, dt);
  vel.x = (vel.x + (target.x - pos.x) * k) * damp;
  vel.y = (vel.y + (target.y - pos.y) * k) * damp;
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
  const settled =
    Math.abs(vel.x) < 0.05 &&
    Math.abs(vel.y) < 0.05 &&
    Math.abs(target.x - pos.x) < 0.5 &&
    Math.abs(target.y - pos.y) < 0.5;
  if (settled) {
    pos.x = target.x;
    pos.y = target.y;
    return null;
  }
  return clampTilt(vel.x * 0.35);
}

/** Lane whose slot center is nearest the card's center. Works for side-by-side
    lanes (desktop) and stacked lanes (mobile). */
export function nearestColumn(slots: Slots, card: Vec): ColumnKey | null {
  const backlog = slots.backlog;
  if (!backlog) return null;
  const cx = card.x + backlog.w / 2;
  const cy = card.y + backlog.h / 2;
  let best: ColumnKey | null = null;
  let bd = Infinity;
  for (const k of COLUMN_KEYS) {
    const s = slots[k];
    if (!s) continue;
    const d = Math.hypot(cx - (s.x + s.w / 2), cy - (s.y + s.h / 2));
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return best;
}

/** Keyboard move: the lane after `col`, wrapping back to the first. */
export const nextColumn = (col: ColumnKey): ColumnKey =>
  COLUMN_KEYS[(COLUMN_KEYS.indexOf(col) + 1) % COLUMN_KEYS.length];

export const heroMeta = (sync: SyncState) =>
  sync === 'pending' ? 'TC-142 · syncing…' : 'TC-142 · now';

/* ---------- optimistic-UI timeline ---------- */

export type Phase = 'idle' | 'moved' | 'syncing' | 'synced';

const PHASE_ORDER: Phase[] = ['idle', 'moved', 'syncing', 'synced'];

/** Simulated timings in ms after the card moves (the "design tokens"). */
export const TIMELINE_MS = { syncing: 120, synced: 640 } as const;
/** Pause on the idle state before the replayed move starts. */
export const REPLAY_LEAD_MS = 400;

const PHASE_ROWS: { phase: Phase; time: string; label: string }[] = [
  { phase: 'idle', time: 't0', label: 'Card waits in DOING' },
  {
    phase: 'moved',
    time: '0 ms',
    label: 'Card lands in DONE: your board, everyone’s screen',
  },
  {
    phase: 'syncing',
    time: `+${TIMELINE_MS.syncing} ms`,
    label: 'Request in flight, UI already updated',
  },
  {
    phase: 'synced',
    time: `+${TIMELINE_MS.synced} ms`,
    label: 'Server ack · synced',
  },
];

export type PhaseStatus = 'current' | 'reached' | 'pending';

/** Rows for the timeline with each row's status relative to `current`. */
export function phaseRows(current: Phase) {
  const at = PHASE_ORDER.indexOf(current);
  return PHASE_ROWS.map((row, i) => ({
    ...row,
    status: (i === at
      ? 'current'
      : i < at
        ? 'reached'
        : 'pending') as PhaseStatus,
  }));
}

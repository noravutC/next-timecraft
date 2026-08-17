/* Pure logic for the /case-study page — ported 1:1 from the design's
   DCLogic reference (spring drag, dot-grid canvas, optimistic-UI demo).
   Keep constants byte-identical to that reference. */

export type ColumnKey = 'backlog' | 'doing' | 'done';
export type SyncState = 'synced' | 'pending';
export type Vec = { x: number; y: number };
export type Slot = { x: number; y: number; w: number; h: number };
export type Slots = Partial<Record<ColumnKey, Slot>>;

export const COLUMN_KEYS = ['backlog', 'doing', 'done'] as const;

export const SYNC_DELAY_MS = 450;
export const NUDGE_INTERVAL_MS = 7000;
export const INIT_MEASURE_DELAY_MS = 120;
export const DEMO_REPLAY_RESET_MS = 60;
export const DEMO_IO_THRESHOLD = 0.3;

const SPRING_K = 0.11;
const SPRING_DAMP = 0.82;
const DRAG_FOLLOW_BASE = 0.72;
const TILT_CLAMP_DEG = 6;

export const GRID_SPACING = 28;
export const GRID_ROW_STEP = GRID_SPACING * 0.62;
export const GRID_DOT_R = 1.3;
export const GLOW_RADIUS = 150;
export const IDLE_AFTER_MS = 2500;

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

/** Column whose horizontal center is nearest to the card's center. */
export function nearestColumn(slots: Slots, cardX: number): ColumnKey | null {
  const backlog = slots.backlog;
  if (!backlog) return null;
  const cx = cardX + backlog.w / 2;
  let best: ColumnKey | null = null;
  let bd = Infinity;
  for (const k of COLUMN_KEYS) {
    const s = slots[k];
    if (!s) continue;
    const d = Math.abs(cx - (s.x + s.w / 2));
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return best;
}

/* ---------- dot-grid canvas ---------- */

/** Static isometric dot grid — drawn once into an offscreen canvas, blitted per frame. */
export function drawBaseGrid(c: CanvasRenderingContext2D, w: number, h: number) {
  c.fillStyle = 'rgba(91,80,230,0.09)';
  const sp = GRID_SPACING;
  for (let row = 0, y = 10; y < h + sp; row++, y += GRID_ROW_STEP) {
    const off = row % 2 ? sp / 2 : 0;
    for (let x = off; x < w + sp; x += sp) {
      c.beginPath();
      c.arc(x, y, GRID_DOT_R, 0, 6.2832);
      c.fill();
    }
  }
}

/** Cursor glow: brightness 0.10+e*0.55, radius +e*1.5, e=(1-dist/R)^2. */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  glow: Vec,
  w: number,
  h: number,
) {
  const R = GLOW_RADIUS;
  const gx = glow.x;
  const gy = glow.y;
  if (gx < -1000) return;
  const sp = GRID_SPACING;
  for (let row = 0, y = 10; y < h + sp; row++, y += GRID_ROW_STEP) {
    if (Math.abs(y - gy) > R) continue;
    const off = row % 2 ? sp / 2 : 0;
    for (let x = off; x < w + sp; x += sp) {
      const dx = x - gx;
      const dy = y - gy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > R) continue;
      const t = 1 - dist / R;
      const e = t * t;
      ctx.fillStyle = 'rgba(108,92,231,' + (0.1 + e * 0.55).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(x, y, GRID_DOT_R + e * 1.5, 0, 6.2832);
      ctx.fill();
    }
  }
}

/** Autonomous sine drift target for the glow when the cursor has been idle. */
export function driftMouse(t: number, w: number, h: number): Vec {
  const s = t / 1000;
  return {
    x: w * 0.5 + Math.sin(s * 0.23) * w * 0.34,
    y: h * 0.42 + Math.sin(s * 0.31 + 1.3) * h * 0.3,
  };
}

/* ---------- render-value derivation ---------- */

export type BoardVisuals = {
  counts: Record<ColumnKey, number>;
  syncLabel: string;
  syncPending: boolean;
};

export function deriveBoardVisuals(
  col: ColumnKey,
  sync: SyncState,
): BoardVisuals {
  const counts: Record<ColumnKey, number> = { backlog: 2, doing: 1, done: 1 };
  counts[col] += 1;
  return {
    counts,
    syncLabel: sync === 'pending' ? 'syncing…' : 'synced ✓',
    syncPending: sync === 'pending',
  };
}

export type DemoPhase = 0 | 1 | 2;

export function deriveDemoVisuals(demo: DemoPhase) {
  return {
    transform: demo >= 1 ? 'translateX(calc(100% + 40px))' : 'translateX(0)',
    syncLabel: demo === 2 ? 'synced ✓' : demo === 1 ? 'syncing…' : 'idle',
    moved: demo >= 1,
    synced: demo === 2,
    ackMs: SYNC_DELAY_MS,
  };
}

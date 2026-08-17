'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  dragStep,
  INIT_MEASURE_DELAY_MS,
  nearestColumn,
  NUDGE_INTERVAL_MS,
  prefersReducedMotion,
  springStep,
  SYNC_DELAY_MS,
  type ColumnKey,
  type Slots,
  type SyncState,
  type Vec,
} from './case-study-operations';

type BoardState = {
  col: ColumnKey;
  hoverCol: ColumnKey | null;
  sync: SyncState;
};

type Physics = {
  pos: Vec;
  vel: Vec;
  target: Vec;
  grab: Vec;
  pointer: Vec;
  dragging: boolean;
  placed: boolean;
  raf: number;
  boardRect: DOMRect | null;
  slots: Slots;
};

/** Hero-board drag: pointer events + rAF spring integrator, velocity tilt,
    nearest-column snap, idle nudge every 7s, simulated sync ack (450ms).
    Ported 1:1 from the design's DCLogic reference. */
export function useHeroDrag() {
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const slotBacklogRef = useRef<HTMLDivElement>(null);
  const slotDoingRef = useRef<HTMLDivElement>(null);
  const slotDoneRef = useRef<HTMLDivElement>(null);

  const [board, setBoard] = useState<BoardState>({
    col: 'backlog',
    hoverCol: null,
    sync: 'synced',
  });
  const st = useRef<BoardState>(board);
  const syncT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phys = useRef<Physics>({
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    grab: { x: 0, y: 0 },
    pointer: { x: 0, y: 0 },
    dragging: false,
    placed: false,
    raf: 0,
    boardRect: null,
    slots: {},
  });

  const setState = useCallback((patch: Partial<BoardState>) => {
    st.current = { ...st.current, ...patch };
    setBoard(st.current);
  }, []);

  const apply = useCallback((tilt: number) => {
    const c = cardRef.current;
    if (!c) return;
    const p = phys.current;
    c.style.transform = `translate(${p.pos.x}px,${p.pos.y}px) rotate(${tilt}deg)`;
  }, []);

  const startLoop = useCallback(() => {
    const p = phys.current;
    if (p.raf) return;
    let last = performance.now();
    const step = (t: number) => {
      const dt = Math.min((t - last) / 16.67, 2);
      last = t;
      if (p.dragging && p.boardRect) {
        const follow = {
          x: p.pointer.x - p.boardRect.left - p.grab.x,
          y: p.pointer.y - p.boardRect.top - p.grab.y,
        };
        apply(dragStep(p.pos, p.vel, follow, dt, prefersReducedMotion()));
      } else {
        const tilt = springStep(p.pos, p.vel, p.target, dt);
        if (tilt === null) {
          apply(0);
          p.raf = 0;
          return;
        }
        apply(tilt);
      }
      p.raf = requestAnimationFrame(step);
    };
    p.raf = requestAnimationFrame(step);
  }, [apply]);

  const snapHome = useCallback(
    (instant: boolean) => {
      const p = phys.current;
      const s = p.slots[st.current.col];
      if (!s) return;
      p.target = { x: s.x, y: s.y };
      if (instant || prefersReducedMotion()) {
        p.pos = { ...p.target };
        p.vel = { x: 0, y: 0 };
        apply(0);
        p.placed = true;
      } else startLoop();
    },
    [apply, startLoop],
  );

  const measure = useCallback(() => {
    const b = boardRef.current;
    if (!b) return;
    const p = phys.current;
    p.boardRect = b.getBoundingClientRect();
    p.slots = {};
    const slotRefs: [ColumnKey, typeof slotBacklogRef][] = [
      ['backlog', slotBacklogRef],
      ['doing', slotDoingRef],
      ['done', slotDoneRef],
    ];
    for (const [k, r] of slotRefs) {
      const el = r.current;
      if (!el) continue;
      const s = el.getBoundingClientRect();
      p.slots[k] = {
        x: s.left - p.boardRect.left,
        y: s.top - p.boardRect.top,
        w: s.width,
        h: s.height,
      };
    }
    const card = cardRef.current;
    if (card && p.slots.backlog) {
      card.style.width = `${p.slots.backlog.w}px`;
      const ch = card.getBoundingClientRect().height;
      if (ch > 20) {
        for (const [, r] of slotRefs) {
          if (r.current) r.current.style.height = `${ch}px`;
        }
        for (const k of Object.keys(p.slots) as ColumnKey[]) {
          p.slots[k]!.h = ch;
        }
      }
    }
    snapHome(!p.placed);
  }, [snapHome]);

  const nudge = useCallback(() => {
    const p = phys.current;
    const s = p.slots[st.current.col];
    if (!s) return;
    p.pos = { x: s.x, y: s.y - 14 };
    p.vel = { x: 0, y: 0.5 };
    startLoop();
  }, [startLoop]);

  const drop = useCallback(() => {
    const p = phys.current;
    p.dragging = false;
    const card = cardRef.current;
    if (card) {
      card.style.cursor = 'grab';
      card.style.boxShadow = '0 2px 10px rgba(91,80,230,0.10)';
    }
    const dest = nearestColumn(p.slots, p.pos.x) ?? st.current.col;
    const moved = dest !== st.current.col;
    setState({
      col: dest,
      hoverCol: null,
      sync: moved ? 'pending' : st.current.sync,
    });
    const s = p.slots[dest];
    if (s) p.target = { x: s.x, y: s.y };
    if (prefersReducedMotion()) {
      p.pos = { ...p.target };
      p.vel = { x: 0, y: 0 };
      apply(0);
    } else startLoop();
    if (moved) {
      if (syncT.current) clearTimeout(syncT.current);
      syncT.current = setTimeout(
        () => setState({ sync: 'synced' }),
        SYNC_DELAY_MS,
      );
    }
  }, [apply, setState, startLoop]);

  const onCardPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      measure();
      const p = phys.current;
      p.dragging = true;
      p.pointer = { x: e.clientX, y: e.clientY };
      if (p.boardRect) {
        p.grab = {
          x: e.clientX - p.boardRect.left - p.pos.x,
          y: e.clientY - p.boardRect.top - p.pos.y,
        };
      }
      const card = cardRef.current;
      if (card) {
        card.style.cursor = 'grabbing';
        card.style.boxShadow = '0 12px 30px rgba(91,80,230,0.22)';
      }
      setState({ hoverCol: nearestColumn(p.slots, p.pos.x) });
      startLoop();
    },
    [measure, setState, startLoop],
  );

  useEffect(() => {
    const p = phys.current;
    const onMove = (e: PointerEvent) => {
      if (!p.dragging) return;
      p.pointer = { x: e.clientX, y: e.clientY };
      const c = nearestColumn(p.slots, p.pos.x);
      if (c !== st.current.hoverCol) setState({ hoverCol: c });
    };
    const onUp = () => {
      if (p.dragging) drop();
    };
    window.addEventListener('resize', measure);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    const initT = setTimeout(() => {
      measure();
      snapHome(true);
      if (!prefersReducedMotion()) nudge();
    }, INIT_MEASURE_DELAY_MS);
    const nudgeInt = setInterval(() => {
      if (!p.dragging && !prefersReducedMotion() && st.current.sync !== 'pending') {
        nudge();
      }
    }, NUDGE_INTERVAL_MS);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      clearTimeout(initT);
      clearInterval(nudgeInt);
      if (syncT.current) clearTimeout(syncT.current);
      if (p.raf) cancelAnimationFrame(p.raf);
    };
  }, [drop, measure, nudge, setState, snapHome]);

  return {
    boardRef,
    cardRef,
    slotRefs: {
      backlog: slotBacklogRef,
      doing: slotDoingRef,
      done: slotDoneRef,
    },
    board,
    onCardPointerDown,
  };
}

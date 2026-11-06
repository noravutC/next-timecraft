'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEMO_IO_THRESHOLD,
  prefersReducedMotion,
  REPLAY_LEAD_MS,
  TIMELINE_MS,
  type Phase,
} from './case-study-operations';

/** Optimistic-UI timeline: idle → moved → syncing → synced on the timings in
    TIMELINE_MS. Plays once when scrolled into view, then on Replay. Starts
    (and with reduced motion, stays) on the finished state. */
export function useSyncDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>('synced');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const replay = useCallback(() => {
    clearTimers();
    if (prefersReducedMotion()) {
      setPhase('synced');
      return;
    }
    setPhase('idle');
    timers.current = [
      setTimeout(() => setPhase('moved'), REPLAY_LEAD_MS),
      setTimeout(
        () => setPhase('syncing'),
        REPLAY_LEAD_MS + TIMELINE_MS.syncing,
      ),
      setTimeout(() => setPhase('synced'), REPLAY_LEAD_MS + TIMELINE_MS.synced),
    ];
  }, [clearTimers]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          replay();
          io.disconnect();
        }
      },
      { threshold: DEMO_IO_THRESHOLD },
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => {
      io.disconnect();
      clearTimers();
    };
  }, [replay, clearTimers]);

  return { sectionRef, phase, replay };
}

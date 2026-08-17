'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEMO_IO_THRESHOLD,
  DEMO_REPLAY_RESET_MS,
  prefersReducedMotion,
  SYNC_DELAY_MS,
  type DemoPhase,
} from './case-study-operations';

/** Optimistic-UI demo: autoplays once when scrolled into view
    (IntersectionObserver threshold 0.3), then replayable.
    Phases: 0 idle → 1 moved/syncing → 2 synced (after 450ms). */
export function useSyncDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [demo, setDemo] = useState<DemoPhase>(0);
  const demoRef = useRef<DemoPhase>(0);
  const demoT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPhase = useCallback((v: DemoPhase) => {
    demoRef.current = v;
    setDemo(v);
  }, []);

  const runDemo = useCallback(() => {
    if (demoT.current) clearTimeout(demoT.current);
    setPhase(1);
    if (prefersReducedMotion()) setPhase(2);
    else demoT.current = setTimeout(() => setPhase(2), SYNC_DELAY_MS);
  }, [setPhase]);

  const replay = useCallback(() => {
    setPhase(0);
    setTimeout(() => runDemo(), DEMO_REPLAY_RESET_MS);
  }, [runDemo, setPhase]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting && demoRef.current === 0) {
          runDemo();
          io.disconnect();
        }
      },
      { threshold: DEMO_IO_THRESHOLD },
    );
    const target = cardRef.current || sectionRef.current;
    if (target) io.observe(target);
    return () => {
      io.disconnect();
      if (demoT.current) clearTimeout(demoT.current);
    };
  }, [runDemo]);

  return { sectionRef, cardRef, demo, replay };
}

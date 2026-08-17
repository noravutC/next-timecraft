'use client';

import { useEffect, useRef } from 'react';
import {
  drawBaseGrid,
  drawGlow,
  driftMouse,
  IDLE_AFTER_MS,
  prefersReducedMotion,
  type Vec,
} from './case-study-operations';

/** Fixed full-viewport isometric dot grid with a cursor-following glow.
    Base grid cached on an offscreen canvas (one blit per frame); pointer
    lerp f=0.14 (0.05 while idle-drifting); sine drift after 2500ms idle;
    devicePixelRatio aware; reduced motion → static grid, no loop. */
export function useDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;

    let baseCv: HTMLCanvasElement | null = null;
    const mouse: Vec = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.35,
    };
    const glow: Vec = { x: mouse.x, y: mouse.y - 120 };
    let lastPointerT = 0;
    let raf = 0;

    const draw = () => {
      if (!baseCv) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(baseCv, 0, 0, w, h);
      drawGlow(ctx, glow, w, h);
    };

    const resize = () => {
      const d = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      cv.width = w * d;
      cv.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      baseCv = document.createElement('canvas');
      baseCv.width = w * d;
      baseCv.height = h * d;
      const c = baseCv.getContext('2d');
      if (c) {
        c.setTransform(d, 0, 0, d, 0, 0);
        drawBaseGrid(c, w, h);
      }
      draw();
    };

    const startLoop = () => {
      if (raf) return;
      const step = (t: number) => {
        const idle = performance.now() - lastPointerT > IDLE_AFTER_MS;
        if (idle) {
          const m = driftMouse(t, window.innerWidth, window.innerHeight);
          mouse.x = m.x;
          mouse.y = m.y;
        }
        const f = idle ? 0.05 : 0.14;
        glow.x += (mouse.x - glow.x) * f;
        glow.y += (mouse.y - glow.y) * f;
        draw();
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      lastPointerT = performance.now();
      if (!prefersReducedMotion()) startLoop();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove);
    if (!prefersReducedMotion()) startLoop();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return canvasRef;
}

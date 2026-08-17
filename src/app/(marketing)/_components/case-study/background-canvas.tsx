'use client';

import { useDotGrid } from './use-dot-grid';

export function BackgroundCanvas() {
  const canvasRef = useDotGrid();
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}

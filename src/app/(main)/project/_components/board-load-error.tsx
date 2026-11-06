'use client';

import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** In place of the columns when the board couldn't be fetched. */
export const BoardLoadError = ({
  name,
  onRetry,
}: {
  name: string | null;
  onRetry: () => void;
}) => (
  <div
    role="alert"
    className="mx-auto mt-12 flex h-55 w-full max-w-135 flex-col items-center justify-center gap-2.5 rounded-xl border border-line px-6 text-center"
  >
    <span className="grid size-9 place-items-center rounded-lg bg-danger-soft text-danger-text">
      <TriangleAlert className="size-4.5" />
    </span>
    <span className="text-md font-semibold text-ink">
      Couldn’t load {name ?? 'this board'}
    </span>
    <span className="text-sm text-ink-subtle">
      Check your connection. Nothing on the board was lost.
    </span>
    <Button size="sm" onClick={onRetry} className="mt-1">
      Try again
    </Button>
  </div>
);

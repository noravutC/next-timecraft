'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BreakdownResult } from './use-ai-breakdown';

interface ResultsProps {
  result: BreakdownResult;
  /** still streaming: rows keep arriving, no "View on board" yet */
  generating: boolean;
  onViewBoard: () => void;
}

/** Tasks the last run added, listed as they stream in. */
export const AiBreakdownResults = ({
  result,
  generating,
  onViewBoard,
}: ResultsProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <span className="text-sm leading-5 font-medium text-ink">
        Added to {result.columnTitle}
      </span>
      <span className="font-mono text-xs leading-5 text-ink-subtle">
        {result.titles.length} {result.titles.length === 1 ? 'task' : 'tasks'}
      </span>
    </div>
    {result.titles.length > 0 && (
      <ul className="flex flex-col overflow-hidden rounded-popover border border-line">
        {result.titles.map((title, i) => (
          <li
            key={`${i}-${title}`}
            className="flex min-h-10 items-center gap-2.5 border-t border-line-soft px-3 py-2 first:border-t-0"
          >
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-success-soft text-success-text">
              <Check className="size-2.5 stroke-3" />
            </span>
            <span className="flex-1 text-sm text-ink">{title}</span>
          </li>
        ))}
      </ul>
    )}
    {!generating && (
      <Button
        variant="link"
        size={null}
        onClick={onViewBoard}
        className="self-start text-sm leading-5 underline"
      >
        View on board
      </Button>
    )}
  </div>
);

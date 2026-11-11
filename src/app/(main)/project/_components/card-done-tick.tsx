'use client';

import { CircleCheck } from 'lucide-react';
import { toggleTaskDone } from '@/components/project/task-completion';
import type { TCard } from './data';

export type CardDoneState = {
  /** the card sits in the board's Done column */
  done: boolean;
  /** that column's color, for the check */
  color?: string;
  /** the board has a Done column and this person may move cards */
  canToggle: boolean;
};

/**
 * End of the card's meta row: a check in the column's color once done
 * (click to reopen), or a quiet "Mark as done" that shows on hover.
 */
export const CardDoneTick = ({
  card,
  state,
}: {
  card: TCard;
  state: CardDoneState;
}) => {
  const check = (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <circle cx="12" cy="12" r="11" fill={state.color ?? '#94A3B8'} />
      <path
        d="m7.5 12.5 3 3 6-6.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (state.done && !state.canToggle) {
    return (
      <span role="img" aria-label="Done">
        {check}
      </span>
    );
  }
  if (!state.done && !state.canToggle) return null;

  return (
    <button
      type="button"
      data-card-action
      aria-label={state.done ? 'Mark as not done' : 'Mark as done'}
      title={state.done ? 'Done. Click to mark as not done' : 'Mark as done'}
      onClick={(e) => {
        e.stopPropagation();
        toggleTaskDone(card);
      }}
      className={
        state.done
          ? 'cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ink/10'
          : 'cursor-pointer rounded-full text-ink-faint opacity-0 outline-none group-hover:opacity-100 hover:text-ink focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ink/10'
      }
    >
      {state.done ? check : <CircleCheck className="size-4" />}
    </button>
  );
};

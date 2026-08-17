'use client';

import { cn } from '@/lib/utils';
import { deriveBoardVisuals, COLUMN_KEYS } from './case-study-operations';
import { useHeroDrag } from './use-hero-drag';

const COLUMNS = {
  backlog: {
    label: 'BACKLOG',
    cards: [
      { title: 'Rate-limit the sync endpoint', meta: 'TC-139 · 3d ago' },
      { title: 'Dark mode for the board view', meta: 'TC-127 · 5d ago' },
    ],
    done: false,
  },
  doing: {
    label: 'DOING',
    cards: [{ title: 'Presence cursors on card hover', meta: 'TC-131 · 1d ago' }],
    done: false,
  },
  done: {
    label: 'DONE',
    cards: [{ title: 'Board keyboard shortcuts', meta: 'TC-118 · synced ✓' }],
    done: true,
  },
} as const;

const columnStateStyles = {
  idle: 'border-solid border-line bg-surface',
  hovered: 'border-dashed border-brand bg-brand-soft',
} as const;

export function HeroBoard() {
  const { boardRef, cardRef, slotRefs, board, onCardPointerDown } =
    useHeroDrag();
  const visuals = deriveBoardVisuals(board.col, board.sync);

  return (
    <>
      <div
        id="board"
        ref={boardRef}
        className="relative mx-auto mt-7 max-w-230 touch-pan-y scroll-mt-6 px-8"
      >
        <div className="grid grid-cols-3 gap-4">
          {COLUMN_KEYS.map((key) => {
            const col = COLUMNS[key];
            return (
              <div
                key={key}
                className={cn(
                  'flex min-h-60 flex-col gap-2.5 rounded-2xl border p-3',
                  columnStateStyles[
                    board.hoverCol === key ? 'hovered' : 'idle'
                  ],
                )}
              >
                <div className="flex items-center justify-between px-1 py-0.5">
                  <span className="cs-mono text-xs font-bold text-ink-muted">
                    {col.label}
                  </span>
                  <span className="cs-mono text-xs text-ink-subtle">
                    {visuals.counts[key]}
                  </span>
                </div>
                <div ref={slotRefs[key]} className="h-23 rounded-xl" />
                {col.cards.map((card) => (
                  <div
                    key={card.meta}
                    className={cn(
                      'rounded-xl border border-line bg-white p-3',
                      col.done && 'opacity-70',
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm leading-snug font-semibold',
                        col.done && 'text-ink-muted line-through',
                      )}
                    >
                      {card.title}
                    </div>
                    <div className="cs-mono mt-2 text-xs text-ink-subtle">
                      {card.meta}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* THE live card */}
        <div
          ref={cardRef}
          onPointerDown={onCardPointerDown}
          className="absolute top-0 left-0 box-border w-25 cursor-grab touch-none rounded-xl border border-brand-line bg-white p-3 shadow-[0_2px_10px_rgba(91,80,230,0.10)] select-none will-change-transform"
        >
          <div className="mb-2 flex gap-1.5">
            <span className="cs-mono rounded-md bg-brand-soft px-1.75 py-0.5 text-xs font-bold text-brand">
              feature
            </span>
          </div>
          <div className="text-sm leading-snug font-semibold">
            Ship the drag physics for hero card
          </div>
          <div className="mt-2.25 flex items-center justify-between">
            <span className="cs-mono text-xs text-ink-subtle">
              TC-142 · now
            </span>
            <span
              className={cn(
                'cs-mono text-xs font-bold',
                visuals.syncPending ? 'text-ink-subtle' : 'text-emerald-600',
              )}
            >
              {visuals.syncLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 pt-8.5 pb-18 text-center">
        <div className="cs-mono mx-auto max-w-140 text-xs leading-relaxed text-ink-muted">
          ↑ pointer events + spring integration (rAF loop) · velocity-based
          tilt · nearest-column snap · simulated server ack — no drag library
        </div>
      </div>
    </>
  );
}

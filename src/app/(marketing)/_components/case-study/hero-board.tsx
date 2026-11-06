'use client';

import { cn } from '@/lib/utils';
import { LANES } from './case-study-content';
import { COLUMN_KEYS, heroMeta } from './case-study-operations';
import { useHeroDrag } from './use-hero-drag';

const laneStyles = {
  idle: 'border-line',
  hovered: 'border-dashed border-ink-faint',
} as const;

export function HeroBoard() {
  const {
    boardRef,
    cardRef,
    slotRefs,
    board,
    onCardPointerDown,
    onCardKeyDown,
  } = useHeroDrag();

  return (
    <section
      id="board"
      aria-label="Interactive board demo"
      className="mx-auto max-w-292 scroll-mt-16 px-6 pt-6 pb-24"
    >
      <div className="cs-dots rounded-xl border border-line bg-surface p-5">
        <div ref={boardRef} className="relative touch-pan-y">
          <div className="grid gap-3.5 md:grid-cols-3">
            {COLUMN_KEYS.map((key) => (
              <div
                key={key}
                className={cn(
                  'flex flex-col gap-2.5 rounded-popover border bg-background p-2.5 md:min-h-60.5',
                  laneStyles[board.hoverCol === key ? 'hovered' : 'idle'],
                )}
              >
                <div className="flex items-center gap-2 px-1 py-0.5">
                  <span
                    className="size-1.75 rounded-full"
                    style={{ backgroundColor: LANES[key].color }}
                  />
                  <span className="font-mono text-2xs leading-6 tracking-wide text-ink-muted">
                    {LANES[key].name}
                  </span>
                </div>
                {LANES[key].cards.map((title) => (
                  <div
                    key={title}
                    className="rounded-lg border border-line-soft px-3 py-2.5 text-sm leading-6 text-ink-muted"
                  >
                    {title}
                  </div>
                ))}
                {/* where the live card rests in this lane */}
                <div ref={slotRefs[key]} className="h-23 rounded-lg" />
              </div>
            ))}
          </div>

          {/* the live card: dragged by useHeroDrag via transform */}
          <div
            ref={cardRef}
            role="button"
            tabIndex={0}
            aria-describedby="hero-board-hint"
            data-dragging="false"
            onPointerDown={onCardPointerDown}
            onKeyDown={onCardKeyDown}
            className="absolute top-0 left-0 box-border flex w-25 cursor-grab touch-none flex-col gap-2.5 rounded-lg border border-ink bg-background p-3 ring-3 ring-brand/12 will-change-transform outline-none select-none focus-visible:ring-brand/40 data-[dragging=true]:cursor-grabbing data-[dragging=true]:shadow-card-drag"
          >
            <span className="text-base font-medium">
              Ship the drag physics for hero card
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-flex h-5.5 items-center gap-1.25 rounded-full border border-line px-1.75 text-2xs text-ink-muted">
                <span className="size-1.25 rounded-full bg-brand" />
                feature
              </span>
              <span className="font-mono text-2xs leading-6 text-ink-subtle">
                {heroMeta(board.sync)}
              </span>
            </span>
          </div>
        </div>
        <p
          id="hero-board-hint"
          className="mt-3.5 text-center font-mono text-xs leading-6 text-ink-subtle"
        >
          Drag the card to another lane, or focus it and press Enter. Pointer
          events and a spring, no drag library.
        </p>
      </div>
    </section>
  );
}

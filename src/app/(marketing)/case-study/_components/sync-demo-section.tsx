'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { deriveDemoVisuals } from './case-study-operations';
import { useSyncDemo } from './use-sync-demo';

export function SyncDemoSection() {
  const { sectionRef, cardRef, demo, replay } = useSyncDemo();
  const v = deriveDemoVisuals(demo);

  return (
    <section
      id="sync"
      ref={sectionRef}
      className="border-y border-line bg-white px-8 py-20"
    >
      <div className="mx-auto grid max-w-270 items-center gap-16 md:grid-cols-2">
        <div>
          <div className="cs-mono mb-3.5 text-xs font-bold text-brand">
            EXPLAINING OPTIMISTIC UI
          </div>
          <h2 className="mk-display mb-4 text-4xl leading-tight font-extrabold tracking-tight">
            The card moves first. The server catches up.
          </h2>
          <p className="mb-5 text-base leading-relaxed text-pretty text-ink-muted">
            This section demonstrates how I communicate a technical concept
            visually: the card commits to its new column in 0&nbsp;ms while a
            simulated server ack lands a beat later. State machine: idle →
            moved → syncing → synced, with the delay exposed as a design token
            you can tweak.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={replay}
            className="cs-mono h-auto rounded-lg border-brand-line bg-brand-soft px-4.5 py-2.5 text-sm font-bold whitespace-nowrap text-brand shadow-none hover:bg-brand-line hover:text-brand"
          >
            ↻ replay the move
          </Button>
        </div>
        <div>
          <div className="relative grid grid-cols-2 gap-4">
            <div className="min-h-37.5 rounded-2xl border border-line bg-surface p-3">
              <div className="cs-mono mb-2.5 px-1 py-0.5 text-xs font-bold text-ink-muted">
                DOING
              </div>
            </div>
            <div className="min-h-37.5 rounded-2xl border border-line bg-surface p-3">
              <div className="cs-mono mb-2.5 px-1 py-0.5 text-xs font-bold text-ink-muted">
                DONE
              </div>
            </div>
            <div
              ref={cardRef}
              className="cs-demo-card absolute top-10.5 left-3 box-border w-[calc(50%-32px)] rounded-xl border border-brand-line bg-white p-3 shadow-[0_2px_10px_rgba(91,80,230,0.10)]"
              style={{ transform: v.transform }}
            >
              <div className="text-sm leading-snug font-semibold">
                Merge the sync retry patch
              </div>
              <div className="mt-2.25 flex items-center justify-between">
                <span className="cs-mono text-xs text-ink-subtle">TC-140</span>
                <span
                  className={cn(
                    'cs-mono text-xs font-bold',
                    v.synced ? 'text-emerald-600' : 'text-ink-subtle',
                  )}
                >
                  {v.syncLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="cs-mono mt-5.5 flex flex-col gap-2 text-xs">
            <div
              className={cn(
                'flex items-baseline gap-3',
                v.moved ? 'text-ink' : 'text-ink-faint',
              )}
            >
              <span className="w-16 text-right">0 ms</span>
              <span>card lands in DONE: your board, everyone&apos;s screen</span>
            </div>
            <div
              className={cn(
                'flex items-baseline gap-3',
                v.synced ? 'text-emerald-600' : 'text-ink-faint',
              )}
            >
              <span className="w-16 text-right">{v.ackMs} ms</span>
              <span>server ack · synced ✓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

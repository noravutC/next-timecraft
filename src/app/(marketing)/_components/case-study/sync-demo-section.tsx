'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { phaseRows, type PhaseStatus } from './case-study-operations';
import { useSyncDemo } from './use-sync-demo';
import { SectionIntro } from '../section-intro';

const rowStyles: Record<PhaseStatus, string> = {
  current: 'border-ink bg-background',
  reached: 'border-line bg-surface',
  pending: 'border-line bg-surface',
};

const dotStyles: Record<PhaseStatus, string> = {
  current: 'bg-brand',
  reached: 'bg-ink',
  pending: 'bg-input',
};

const labelStyles: Record<PhaseStatus, string> = {
  current: 'text-ink',
  reached: 'text-ink',
  pending: 'text-ink-faint',
};

export function SyncDemoSection() {
  const { sectionRef, phase, replay } = useSyncDemo();

  return (
    <section
      id="sync"
      ref={sectionRef}
      className="scroll-mt-16 border-t border-line bg-surface"
    >
      <div className="mx-auto grid max-w-292 items-center gap-12 px-6 py-24 lg:grid-cols-2">
        <div className="flex flex-col gap-3.5">
          <SectionIntro
            scale="caseStudy"
            eyebrow="Explaining optimistic UI"
            title="The card moves first. The server catches up."
            body="The card commits to its new column in 0 ms while a simulated server ack lands a beat later. State machine: idle, moved, syncing, synced, with the delay exposed as a design token you can tweak."
          />
          <Button
            type="button"
            variant="outline"
            onClick={replay}
            className="mt-1.5 h-10 gap-2 self-start rounded-lg px-3.5 text-base"
          >
            <RotateCcw className="size-3.75" />
            Replay the move
          </Button>
        </div>
        <ol className="flex flex-col gap-2.5 rounded-xl border border-line bg-background p-5">
          {phaseRows(phase).map((row) => (
            <li
              key={row.phase}
              className={cn(
                'flex h-11.5 items-center gap-3 rounded-lg border px-3 transition-colors',
                rowStyles[row.status],
              )}
            >
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  dotStyles[row.status],
                )}
              />
              <span className="w-16 shrink-0 font-mono text-xs text-ink-subtle">
                {row.time}
              </span>
              <span className={cn('text-base', labelStyles[row.status])}>
                {row.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

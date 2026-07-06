import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroBoardPreview } from './hero-board-preview';

const AVATAR_COLORS = [
  'bg-brand',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-sky-500',
];

export function HeroSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-7 pt-20 pb-10">
      {/* ambient blobs */}
      <div
        className="mk-blob pointer-events-none absolute top-10 -left-16 size-[340px] rounded-full blur-lg"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--brand) 20%, transparent), transparent 70%)',
        }}
      />
      <div
        className="mk-blob-reverse pointer-events-none absolute top-56 right-10 size-[300px] rounded-full blur-lg"
        style={{
          background:
            'radial-gradient(circle, rgba(16,185,129,0.16), transparent 70%)',
        }}
      />

      <div className="relative grid items-center gap-11 lg:grid-cols-2">
        {/* copy */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 font-mono text-xs tracking-widest text-ink-muted">
            <span className="size-2 rounded-full bg-emerald-500" />
            KANBAN · REALTIME · AI
          </div>
          <h1 className="mk-display mb-5 text-5xl leading-none font-bold tracking-tight text-balance md:text-6xl lg:text-7xl">
            Every task,
            <br />
            in motion.
          </h1>
          <p className="mb-8 max-w-md text-lg leading-normal text-ink-muted lg:text-xl">
            TimeCraft is a kanban board for small teams. Drag cards across
            lanes, watch teammates&apos; changes land live, and let AI break big
            fuzzy tasks into subtasks you can actually start on.
          </p>
          <div className="flex flex-wrap items-center gap-3.5">
            <Button
              asChild
              className="h-12 rounded-xl px-6 text-md font-semibold shadow-lg shadow-brand/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/40"
            >
              <Link href="/login">
                Start free — no card
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="white"
              className="h-12 rounded-xl border-line px-5 text-md font-semibold transition-transform hover:-translate-y-0.5"
            >
              <Link href="/login">
                <Play className="fill-ink text-ink" />
                Try the guest demo
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-2.5 text-sm text-ink-muted">
            <div className="flex">
              {AVATAR_COLORS.map((color, i) => (
                <span
                  key={color}
                  className={`size-6 rounded-full border-2 border-surface ${color} ${i > 0 ? '-ml-2' : ''}`}
                />
              ))}
            </div>
            <span>
              Built for small teams — every move syncs{' '}
              <strong className="text-ink">live</strong> for everyone on the
              board
            </span>
          </div>
        </div>

        <HeroBoardPreview />
      </div>
    </section>
  );
}

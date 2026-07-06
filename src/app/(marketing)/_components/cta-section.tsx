import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section
      id="cta"
      className="mx-auto max-w-6xl scroll-mt-20 px-7 pt-10 pb-24"
    >
      <div className="relative overflow-hidden rounded-3xl bg-ink p-11 text-center lg:p-20">
        <div
          className="mk-blob pointer-events-none absolute -top-20 -left-10 size-80 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--brand) 40%, transparent), transparent 70%)',
          }}
        />
        <div
          className="mk-blob-reverse pointer-events-none absolute -right-8 -bottom-24 size-[340px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(16,185,129,0.28), transparent 70%)',
          }}
        />
        <div className="relative">
          <h2 className="mk-display mb-4 text-4xl leading-none font-bold tracking-tight text-balance text-white md:text-5xl lg:text-6xl">
            Your best work,
            <br />
            on schedule.
          </h2>
          <p className="mx-auto mb-7 max-w-md text-lg leading-normal text-white/70">
            TimeCraft is free while in development. Sign in with Google — or
            take the guest demo for a spin, no account needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Button
              asChild
              className="h-12 rounded-xl px-6 text-md font-semibold shadow-lg shadow-brand/40 transition-transform hover:-translate-y-0.5"
            >
              <Link href="/login">
                Start free with Google
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              className="h-12 rounded-xl border border-white/20 bg-white/10 px-5 text-md font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-white/15"
            >
              <Link href="/login">
                <Play className="fill-white text-white" />
                Try the guest demo
              </Link>
            </Button>
          </div>
          <div className="mt-5 font-mono text-xs tracking-wider text-white/40">
            FREE WHILE IN DEVELOPMENT · NO CARD REQUIRED
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductPreview } from './product-preview';

export function HeroSection() {
  return (
    <>
      {/* phones: left-aligned, buttons full width and stacked */}
      <section className="mx-auto flex max-w-312 flex-col items-start gap-5 px-5 pt-10 pb-8 sm:items-center sm:gap-6 sm:px-6 sm:pt-24 sm:pb-14 sm:text-center">
        <span className="inline-flex h-7.5 items-center gap-2 rounded-full border border-line px-3 font-mono text-xs text-ink-muted">
          <span className="size-1.5 rounded-full bg-brand" />
          Kanban · Realtime · AI
        </span>
        <h1 className="max-w-205 text-display font-semibold tracking-tighter sm:text-balance">
          Every task, in motion.
        </h1>
        <p className="max-w-155 text-lg leading-6.75 text-pretty text-ink-muted sm:text-lead sm:leading-7">
          TimeCraft is a kanban board for small teams. Drag cards across lanes,
          watch teammates&rsquo; changes land live, and let AI break big fuzzy
          goals into tasks you can actually start on.
        </p>
        <div className="flex w-full flex-col gap-2.5 sm:mt-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
          <Button asChild size="lg" className="h-12 gap-2 px-5 text-md sm:h-11">
            <Link href="/login">
              Start free
              <ArrowRight className="hidden size-3.75 sm:block" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 px-5 text-md sm:h-11"
          >
            <Link href="/login">Try the guest demo</Link>
          </Button>
        </div>
        <span className="text-sm leading-6 text-ink-subtle">
          Free while in development. No card required.
        </span>
      </section>
      <ProductPreview />
    </>
  );
}

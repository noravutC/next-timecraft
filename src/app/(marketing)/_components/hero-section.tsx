import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductPreview } from './product-preview';

export function HeroSection() {
  return (
    <>
      <section className="mx-auto flex max-w-312 flex-col items-center gap-6 px-6 pt-24 pb-14 text-center">
        <span className="inline-flex h-7.5 items-center gap-2 rounded-full border border-line px-3 font-mono text-xs text-ink-muted">
          <span className="size-1.5 rounded-full bg-brand" />
          Kanban · Realtime · AI
        </span>
        <h1 className="max-w-205 text-display font-semibold tracking-tighter text-balance">
          Every task, in motion.
        </h1>
        <p className="max-w-155 text-lead text-pretty text-ink-muted">
          TimeCraft is a kanban board for small teams. Drag cards across lanes,
          watch teammates&rsquo; changes land live, and let AI break big fuzzy
          goals into tasks you can actually start on.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <Button asChild size="lg" className="h-11 gap-2 px-5 text-md">
            <Link href="/login">
              Start free
              <ArrowRight className="size-3.75" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 px-5 text-md"
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

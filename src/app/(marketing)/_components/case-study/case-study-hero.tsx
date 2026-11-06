import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CaseStudyHero() {
  return (
    <section className="mx-auto flex max-w-292 flex-col gap-5.5 px-6 pt-24 pb-12">
      <span className="font-mono text-xs leading-6 text-brand">
        UI engineering case study · everything below is live
      </span>
      <h1 className="max-w-215 text-5xl leading-none font-semibold tracking-tighter text-balance sm:text-6xl lg:text-7xl">
        TimeCraft: designing a board that moves.
      </h1>
      <p className="max-w-160 text-lg leading-7 text-pretty text-ink-muted">
        A production Kanban SaaS I designed, built and deployed solo. This page
        shows the interaction engineering behind it: hand-rolled drag physics,
        an optimistic-UI simulation, and the system underneath.
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2.5">
        <Button asChild size="lg" className="h-11 px-5 text-md">
          <Link href="/login">Try the live demo</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-11 px-5 text-md"
        >
          <Link href="/timecraft">See the product page</Link>
        </Button>
      </div>
    </section>
  );
}

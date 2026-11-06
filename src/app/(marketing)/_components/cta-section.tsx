import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section id="cta" className="border-t border-line">
      <div className="mx-auto flex max-w-312 flex-col items-center gap-5.5 px-6 py-28 text-center">
        <h2 className="text-4xl leading-none font-semibold tracking-tighter text-balance sm:text-5xl lg:text-6xl">
          Your best work, on schedule.
        </h2>
        <p className="max-w-130 text-lg leading-6.75 text-ink-muted">
          TimeCraft is free while in development. Sign in with Google, or take
          the guest demo for a spin with no account.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button asChild size="lg" className="h-11 px-5 text-md">
            <Link href="/login">Start free with Google</Link>
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
      </div>
    </section>
  );
}

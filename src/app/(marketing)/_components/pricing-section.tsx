'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TIERS, tierPrice, type PricingTier } from './landing-content';
import { SectionIntro } from './section-intro';

const BillingToggle = ({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (annual: boolean) => void;
}) => (
  <div
    role="radiogroup"
    aria-label="Billing period"
    className="mt-1.5 inline-flex gap-0.5 rounded-full border border-line bg-background p-0.75"
  >
    {[false, true].map((isAnnual) => (
      <Button
        key={String(isAnnual)}
        type="button"
        variant="ghost"
        role="radio"
        aria-checked={annual === isAnnual}
        onClick={() => onChange(isAnnual)}
        className={cn(
          'h-8 rounded-full px-4',
          annual === isAnnual &&
            'bg-ink text-white hover:bg-ink hover:text-white',
        )}
      >
        {isAnnual ? 'Annual' : 'Monthly'}
        {isAnnual && (
          <span className="font-mono text-2xs opacity-75">up to -25%</span>
        )}
      </Button>
    ))}
  </div>
);

const TierCard = ({ tier, annual }: { tier: PricingTier; annual: boolean }) => {
  const { price, unit } = tierPrice(tier, annual);
  return (
    <article
      className={cn(
        'flex flex-col gap-5 rounded-xl border bg-background p-7',
        tier.featured ? 'border-ink ring-1 ring-ink' : 'border-line',
      )}
    >
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">{tier.name}</h3>
        {tier.planned && (
          <span className="h-5 rounded-full bg-surface-hover px-1.75 font-mono text-2xs leading-5 text-ink-muted">
            Planned
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="flex items-baseline gap-1.5">
          <span className="text-5xl leading-12 font-semibold tracking-tighter">
            {price}
          </span>
          <span className="text-base text-ink-subtle">{unit}</span>
        </span>
        <span className="text-base leading-6 text-ink-muted">
          {tier.tagline}
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-2.5">
        {tier.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2.5 text-base">
            <Check className="mt-0.75 size-3.75 shrink-0 text-ink" />
            {perk}
          </li>
        ))}
      </ul>
      <Button
        asChild
        size="lg"
        variant={tier.featured ? 'default' : 'outline'}
        className="h-10.5"
      >
        <Link href="/login">Start free today</Link>
      </Button>
    </article>
  );
};

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section
      id="pricing"
      className="scroll-mt-16 border-t border-line bg-surface"
    >
      <div className="mx-auto max-w-312 px-6 py-24">
        <div className="mb-10 flex flex-col items-center gap-3.5">
          <SectionIntro
            eyebrow="Pricing"
            badge="Coming soon"
            title="Free while we build."
            body="Billing isn’t switched on yet. Everything below is the plan for later. Right now, every feature is free."
            align="center"
            className="max-w-130"
          />
          <BillingToggle annual={annual} onChange={setAnnual} />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <TierCard key={tier.name} tier={tier} annual={annual} />
          ))}
        </div>
      </div>
    </section>
  );
}

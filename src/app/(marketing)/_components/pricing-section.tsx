'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Planned tiers — billing is not live yet; everything is free during development.
const TIERS = [
  {
    name: 'Solo',
    tagline: 'For getting one project off the ground.',
    monthly: 0,
    annual: 0,
    featured: false,
    perSeat: false,
    perks: [
      '1 project board',
      'Full kanban with comments',
      'AI breakdown, limited runs',
      'Real-time collaboration',
    ],
  },
  {
    name: 'Pro',
    tagline: 'For the freelancer running several projects.',
    monthly: 12,
    annual: 9,
    featured: true,
    perSeat: false,
    perks: [
      'Unlimited boards',
      'Unlimited AI breakdowns',
      'Integrations, when they land',
      'Priority support',
    ],
  },
  {
    name: 'Studio',
    tagline: 'For small teams sharing boards and clients.',
    monthly: 24,
    annual: 19,
    featured: false,
    perSeat: true,
    perks: [
      'Everything in Pro',
      'Shared team workspaces',
      'Roles & permissions controls',
      'Usage & project reports',
    ],
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(true);
  const billingNote = annual ? 'billed yearly' : 'billed monthly';

  const segmentClass = (active: boolean) =>
    cn(
      'h-9 rounded-full px-4 text-sm font-semibold',
      active
        ? 'bg-ink text-white hover:bg-ink hover:text-white'
        : 'text-ink-muted',
    );

  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-7 py-16">
      <div className="mk-reveal mb-10 text-center">
        <div className="mb-3.5 font-mono text-xs tracking-widest text-brand">
          PRICING — COMING SOON
        </div>
        <h2 className="mk-display mb-4 text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl">
          Free while we build.
        </h2>
        <p className="mx-auto mb-5 max-w-lg text-lg leading-normal text-ink-muted">
          Billing isn&apos;t switched on yet — everything below is the plan for
          later. Right now, every feature is free.
        </p>
        <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white p-1">
          <Button
            variant="ghost"
            onClick={() => setAnnual(false)}
            className={segmentClass(!annual)}
          >
            Monthly
          </Button>
          <Button
            variant="ghost"
            onClick={() => setAnnual(true)}
            className={segmentClass(annual)}
          >
            Annual <span className="text-xs opacity-70">−25%</span>
          </Button>
        </div>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {TIERS.map((tier, i) => (
          <div
            key={tier.name}
            className={cn(
              'mk-reveal flex flex-col rounded-2xl p-7',
              i === 1 && 'mk-reveal-d1',
              i === 2 && 'mk-reveal-d2',
              tier.featured
                ? 'relative bg-ink text-white shadow-[0_30px_60px_-26px_rgba(29,30,38,0.55)] lg:scale-[1.03]'
                : 'border border-line bg-white',
            )}
          >
            {tier.featured && (
              <div className="absolute top-5 right-5 rounded-full bg-brand px-2.5 py-1 font-mono text-xs tracking-wider text-white">
                PLANNED
              </div>
            )}
            <div className="mk-display text-lg font-bold">{tier.name}</div>
            <p
              className={cn(
                'mt-1.5 mb-5 text-sm',
                tier.featured ? 'text-white/60' : 'text-ink-subtle',
              )}
            >
              {tier.tagline}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="mk-display text-5xl font-bold tracking-tight">
                ${annual ? tier.annual : tier.monthly}
              </span>
              <span
                className={cn(
                  'text-sm',
                  tier.featured ? 'text-white/60' : 'text-ink-subtle',
                )}
              >
                {tier.monthly === 0 ? 'forever' : '/mo'}
              </span>
            </div>
            <div
              className={cn(
                'mt-1 mb-5 h-4 text-xs',
                tier.featured ? 'text-white/60' : 'text-ink-subtle',
              )}
            >
              {tier.monthly > 0 && (
                <>
                  {billingNote}
                  {tier.perSeat && ' · per seat'}
                </>
              )}
            </div>
            <Button
              asChild
              variant={tier.featured ? 'default' : 'secondary'}
              className={cn(
                'mb-6 h-11 rounded-xl text-md font-semibold',
                tier.featured
                  ? 'shadow-lg shadow-brand/30 transition-transform hover:-translate-y-0.5'
                  : 'bg-surface text-ink hover:bg-surface-active',
              )}
            >
              <Link href="/login">Start free today</Link>
            </Button>
            <div
              className={cn(
                'flex flex-col gap-3 text-sm',
                tier.featured ? 'text-white/85' : 'text-ink-muted',
              )}
            >
              {tier.perks.map((perk) => (
                <div key={perk} className="flex gap-2">
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      tier.featured ? 'text-brand' : 'text-emerald-600',
                    )}
                  />
                  {perk}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

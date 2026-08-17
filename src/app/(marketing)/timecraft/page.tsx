import type { Metadata } from 'next';
import { MarketingNav } from '../_components/marketing-nav';
import { HeroSection } from '../_components/hero-section';
import { FeaturesSection } from '../_components/features-section';
import { HowItWorksSection } from '../_components/how-it-works-section';
import { IntegrationsSection } from '../_components/integrations-section';
import { PricingSection } from '../_components/pricing-section';
import { CtaSection } from '../_components/cta-section';
import { MarketingFooter } from '../_components/marketing-footer';

export const metadata: Metadata = {
  title: 'TimeCraft · Every task, in motion',
  description:
    'TimeCraft is a real-time kanban board for small teams: smooth drag-and-drop, live collaboration, and AI-powered task breakdown. Free while in development.',
};

export default function MarketingPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <IntegrationsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <MarketingFooter />
    </>
  );
}

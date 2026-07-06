import { MarketingNav } from './_components/marketing-nav';
import { HeroSection } from './_components/hero-section';
import { FeaturesSection } from './_components/features-section';
import { HowItWorksSection } from './_components/how-it-works-section';
import { IntegrationsSection } from './_components/integrations-section';
import { PricingSection } from './_components/pricing-section';
import { CtaSection } from './_components/cta-section';
import { MarketingFooter } from './_components/marketing-footer';

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

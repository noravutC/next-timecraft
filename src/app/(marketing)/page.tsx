import type { Metadata } from 'next';
import './case-study.css';
import { AboutSection } from './_components/case-study/about-section';
import { CaseStudyFooter } from './_components/case-study/case-study-footer';
import { CaseStudyHero } from './_components/case-study/case-study-hero';
import { CaseStudyNav } from './_components/case-study/case-study-nav';
import { ContactSection } from './_components/case-study/contact-section';
import { DecisionsSection } from './_components/case-study/decisions-section';
import { EngineeringHighlights } from './_components/case-study/engineering-highlights';
import { HeroBoard } from './_components/case-study/hero-board';
import { SyncDemoSection } from './_components/case-study/sync-demo-section';

export const metadata: Metadata = {
  title: 'Noravut Chanthalay · Full-Stack Engineer',
  description:
    'Full-stack engineer in Bangkok, Thailand. Next.js / React / TypeScript. A live case study of TimeCraft, a production Kanban SaaS: hand-rolled drag physics, optimistic UI, and the engineering underneath.',
};

export default function PortfolioPage() {
  return (
    <>
      <CaseStudyNav />
      <main>
        <CaseStudyHero />
        <HeroBoard />
        <SyncDemoSection />
        <DecisionsSection />
        <EngineeringHighlights />
        <AboutSection />
        <ContactSection />
      </main>
      <CaseStudyFooter />
    </>
  );
}

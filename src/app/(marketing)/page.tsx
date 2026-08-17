import type { Metadata } from 'next';
import { Space_Mono } from 'next/font/google';
import './case-study.css';
import { AboutSection } from './_components/case-study/about-section';
import { BackgroundCanvas } from './_components/case-study/background-canvas';
import { CaseStudyFooter } from './_components/case-study/case-study-footer';
import { CaseStudyHero } from './_components/case-study/case-study-hero';
import { CaseStudyNav } from './_components/case-study/case-study-nav';
import { ContactSection } from './_components/case-study/contact-section';
import { DecisionsSection } from './_components/case-study/decisions-section';
import { EngineeringHighlights } from './_components/case-study/engineering-highlights';
import { HeroBoard } from './_components/case-study/hero-board';
import { SyncDemoSection } from './_components/case-study/sync-demo-section';

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Noravut Chanthalay · Full-Stack Engineer',
  description:
    'Full-stack engineer in Bangkok, Thailand. Next.js / React / TypeScript. A live case study of TimeCraft, a production Kanban SaaS: hand-rolled drag physics, optimistic UI, and the engineering underneath.',
};

export default function PortfolioPage() {
  return (
    <div className={spaceMono.variable}>
      <BackgroundCanvas />
      <div className="relative z-10 min-h-screen overflow-x-hidden">
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
      </div>
    </div>
  );
}

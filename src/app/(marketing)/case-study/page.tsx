import type { Metadata } from 'next';
import { Space_Mono } from 'next/font/google';
import './case-study.css';
import { AboutSection } from './_components/about-section';
import { BackgroundCanvas } from './_components/background-canvas';
import { CaseStudyFooter } from './_components/case-study-footer';
import { CaseStudyHero } from './_components/case-study-hero';
import { CaseStudyNav } from './_components/case-study-nav';
import { DecisionsSection } from './_components/decisions-section';
import { HeroBoard } from './_components/hero-board';
import { SyncDemoSection } from './_components/sync-demo-section';

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TimeCraft — UI Engineering Case Study',
  description:
    'The interaction engineering behind TimeCraft, a production Kanban SaaS: hand-rolled drag physics, an optimistic-UI demo, and a cursor-reactive canvas — no libraries, no video mockups.',
};

export default function CaseStudyPage() {
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
          <AboutSection />
        </main>
        <CaseStudyFooter />
      </div>
    </div>
  );
}

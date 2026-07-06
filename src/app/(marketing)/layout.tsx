import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import './marketing.css';

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TimeCraft — Every task, in motion',
  description:
    'TimeCraft is a real-time kanban board for small teams — smooth drag-and-drop, live collaboration, and AI-powered task breakdown. Free while in development.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${bricolage.variable} h-full overflow-x-clip overflow-y-auto scroll-smooth bg-surface text-ink antialiased`}
    >
      {children}
    </div>
  );
}

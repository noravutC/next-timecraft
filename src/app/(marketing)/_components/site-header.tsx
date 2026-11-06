import Link from 'next/link';
import { Logo } from '@/components/logo-space/logo';
import { cn } from '@/lib/utils';

export type SiteWidth = 'product' | 'case-study';

// 1200px / 1120px of content plus the 24px side padding (the design's
// containers are content-box)
export const SITE_WIDTH: Record<SiteWidth, string> = {
  product: 'max-w-312',
  'case-study': 'max-w-292',
};

interface SiteHeaderProps {
  homeHref: string;
  links: { label: string; href: string }[];
  width: SiteWidth;
  /** Right-hand actions (sign in, primary CTA). */
  children: React.ReactNode;
}

/** Sticky frosted header shared by the marketing pages. */
export function SiteHeader({
  homeHref,
  links,
  width,
  children,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/86 backdrop-blur-md backdrop-saturate-180">
      <div
        className={cn(
          'mx-auto flex h-16 items-center gap-7 px-6',
          SITE_WIDTH[width],
        )}
      >
        <Link href={homeHref} aria-label="TimeCraft home" className="shrink-0">
          <Logo size={24} textSize="copy" />
        </Link>
        {links.length > 0 && (
          <nav
            aria-label="Sections"
            className="hidden flex-wrap items-center gap-6 text-base md:flex"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-ink-muted transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
        <span className="flex-1" />
        {children}
      </div>
    </header>
  );
}

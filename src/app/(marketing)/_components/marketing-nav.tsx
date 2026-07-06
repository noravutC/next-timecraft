import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo-space/logo';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Pricing', href: '#pricing' },
];

export function MarketingNav() {
  return (
    <nav className="mk-nav sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-7">
        <Logo size={30} textSize="lg" />
        <div className="flex items-center gap-7">
          <div className="hidden items-center gap-6 text-md font-medium md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-ink-muted transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </div>
          <Button
            asChild
            className="h-10 rounded-xl bg-ink px-4 text-md font-semibold text-white hover:bg-ink/90"
          >
            <Link href="/login">Start free</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

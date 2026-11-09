import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LANDING_NAV } from './landing-content';
import { MobileMenu } from './mobile-menu';
import { SiteHeader } from './site-header';

export function MarketingNav({
  links = LANDING_NAV,
}: {
  links?: { label: string; href: string }[];
} = {}) {
  return (
    <SiteHeader homeHref="/timecraft" links={links} width="product">
      <Link
        href="/login"
        className="hidden text-base text-ink-muted transition-colors hover:text-ink md:inline"
      >
        Sign in
      </Link>
      <Button asChild className="hidden text-base md:inline-flex">
        <Link href="/login">Start free</Link>
      </Button>
      <MobileMenu />
    </SiteHeader>
  );
}

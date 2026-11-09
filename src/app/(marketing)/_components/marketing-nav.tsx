import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LANDING_NAV } from './landing-content';
import { SiteHeader } from './site-header';

export function MarketingNav() {
  return (
    <SiteHeader homeHref="/timecraft" links={LANDING_NAV} width="product">
      <Link
        href="/login"
        className="hidden text-base text-ink-muted transition-colors hover:text-ink sm:inline"
      >
        Sign in
      </Link>
      <Button asChild className="text-base">
        <Link href="/login">Start free</Link>
      </Button>
    </SiteHeader>
  );
}

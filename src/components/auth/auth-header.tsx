import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo-space/logo';
import { cn } from '@/lib/utils';

interface AuthHeaderProps {
  /** Right-hand item: a link, a step counter. */
  children?: ReactNode;
  /** Makes the logo a link (signed-out pages point it at the product page). */
  logoHref?: string;
  bordered?: boolean;
}

/** 64px top bar for pages outside the app: sign-in, setup, invitations. */
export const AuthHeader = ({
  children,
  logoHref,
  bordered = false,
}: AuthHeaderProps) => {
  const logo = <Logo size={24} textSize="md" />;

  return (
    <header
      className={cn(
        'flex h-16 shrink-0 items-center justify-between gap-3 px-6',
        // box-content keeps the hairline below the 64px bar, as in the design
        bordered && 'box-content border-b border-line',
      )}
    >
      {logoHref ? (
        <Link href={logoHref} aria-label="TimeCraft home">
          {logo}
        </Link>
      ) : (
        logo
      )}
      {children}
    </header>
  );
};

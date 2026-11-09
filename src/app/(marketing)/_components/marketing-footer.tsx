import { LogoMark } from '@/components/logo-space/logo-mark';
import { cn } from '@/lib/utils';
import { FOOTER_NAV } from './landing-content';

export function MarketingFooter({
  links = FOOTER_NAV,
  current,
}: {
  links?: { label: string; href: string }[];
  /** the page being shown, marked in the list */
  current?: string;
} = {}) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-312 flex-wrap items-center gap-5 px-6 py-7 text-sm leading-6 text-ink-subtle">
        <span className="flex items-center gap-2">
          <LogoMark size={18} />© 2026 TimeCraft
        </span>
        <span className="flex-1" />
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            aria-current={link.href === current ? 'page' : undefined}
            className={cn(
              'transition-colors hover:text-ink',
              link.href === current && 'text-ink',
            )}
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}

import { Logo } from '@/components/logo-space/logo';

const FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Sign up', href: '#cta' },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-7 py-10">
        <div className="flex items-center gap-2.5">
          <Logo size={26} textSize="sm" />
          <span className="text-sm text-ink-subtle">© 2026</span>
        </div>
        <div className="flex gap-6 text-sm">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

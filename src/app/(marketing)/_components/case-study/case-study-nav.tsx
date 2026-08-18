import { Logo } from '@/components/logo-space/logo';

const NAV_LINKS = [
  { label: 'Interaction', href: '#board' },
  { label: 'Optimistic UI', href: '#sync' },
  { label: 'Decisions', href: '#decisions' },
  { label: 'Contact', href: '#contact' },
];

export function CaseStudyNav() {
  return (
    <nav className="mx-auto flex max-w-270 items-center justify-between px-8 py-5.5">
      <Logo size={30} textSize="lg" />
      <div className="flex items-center gap-7">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="hidden text-sm font-semibold whitespace-nowrap text-ink-muted transition-colors hover:text-brand-dark sm:inline"
          >
            {link.label}
          </a>
        ))}
        <span className="cs-mono rounded-full border border-brand-line bg-brand-soft px-3 py-1.5 text-xs whitespace-nowrap text-brand">
          case study · live demo
        </span>
      </div>
    </nav>
  );
}

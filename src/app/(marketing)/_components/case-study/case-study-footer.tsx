import { GITHUB_URL, LINKEDIN_URL } from './case-study-content';

const FOOTER_LINKS = [
  { label: 'github', href: GITHUB_URL },
  { label: 'linkedin', href: LINKEDIN_URL },
];

export function CaseStudyFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-292 flex-wrap items-center gap-4 p-6 font-mono text-xs leading-6 text-ink-subtle">
        <span>© 2026 Noravut Chanthalay · TimeCraft</span>
        <span className="flex-1" />
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-ink"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}

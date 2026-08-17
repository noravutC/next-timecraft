const FOOTER_LINKS = [
  { label: 'github', href: 'https://github.com/noravutC' },
  {
    label: 'linkedin',
    href: 'https://www.linkedin.com/in/noravut-chanthalay-2396672b6/',
  },
];

export function CaseStudyFooter() {
  return (
    <footer className="cs-mono flex flex-wrap justify-center gap-6 border-t border-line px-8 py-5.5 text-xs text-ink-subtle">
      <span>© 2026 Noravut Chanthalay · TimeCraft</span>
      {FOOTER_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-ink-muted hover:text-brand-dark hover:underline"
        >
          {link.label}
        </a>
      ))}
    </footer>
  );
}

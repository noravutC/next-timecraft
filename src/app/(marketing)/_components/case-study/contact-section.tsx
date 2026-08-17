import { Button } from '@/components/ui/button';

const PROFILE_LINKS = [
  { label: 'GitHub', href: 'https://github.com/noravutC' },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/noravut-chanthalay-2396672b6/',
  },
];

export function ContactSection() {
  return (
    <section id="contact" className="mx-auto max-w-270 px-8 pt-16 pb-20 text-center">
      <h2 className="mk-display mb-3 text-4xl font-extrabold tracking-tight">
        Let&apos;s talk
      </h2>
      <p className="mx-auto mb-6 max-w-155 text-base leading-relaxed text-ink-muted">
        Open to full-stack roles and interesting projects. The fastest way to
        reach me is email.
      </p>
      <a
        href="mailto:noravut.ch@gmail.com"
        className="mk-display inline-block text-2xl font-extrabold tracking-tight break-all text-brand hover:text-brand-dark hover:underline md:text-4xl"
      >
        noravut.ch@gmail.com
      </a>
      <div className="mt-7 flex flex-wrap justify-center gap-3.5">
        {PROFILE_LINKS.map((link) => (
          <Button
            key={link.href}
            asChild
            variant="outline"
            className="cs-mono h-auto rounded-lg border-brand-line bg-brand-soft px-4.5 py-2.5 text-sm font-bold whitespace-nowrap text-brand shadow-none hover:bg-brand-line hover:text-brand"
          >
            <a href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </Button>
        ))}
      </div>
    </section>
  );
}

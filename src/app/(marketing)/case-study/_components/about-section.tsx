import { Logo } from '@/components/logo-space/logo';

const IDENTITY_LINKS = [
  { label: 'github.com/noravutC', href: 'https://github.com/noravutC' },
  { label: 'linkedin', href: 'https://linkedin.com/in/noravutchanthalay' },
  { label: 'noravut.dev', href: 'https://noravut.dev' },
  { label: 'noravut.ch@gmail.com', href: 'mailto:noravut.ch@gmail.com' },
];

const TAGS = [
  'interaction design',
  'motion engineering',
  'brand & copy',
  'canvas rendering',
];

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-270 px-8 pt-16 pb-12 text-center">
      <h2 className="mk-display mb-4.5 text-4xl font-extrabold tracking-tight">
        About this project
      </h2>
      <p className="mx-auto max-w-155 text-base leading-relaxed text-pretty text-ink-muted">
        TimeCraft is a real product I built and operate end to end — concept,
        copy, visual system, every line of interaction code, and the
        production app behind it. Built with vanilla pointer events, canvas,
        and a requestAnimationFrame spring integrator — concurrent state is
        what I work on daily.
      </p>
      <div className="mt-7.5 inline-flex flex-col items-start gap-3.5 rounded-2xl border border-line bg-white px-7 py-5 text-left shadow-[0_2px_10px_rgba(91,80,230,0.06)]">
        <Logo size={44} textSize="lg" />
        <div className="flex max-w-130 flex-col gap-1">
          <div className="mk-display text-lg font-extrabold tracking-tight text-ink">
            Noravut Chanthalay
          </div>
          <div className="text-sm text-ink-muted">
            Full-Stack Engineer · Next.js / React / TypeScript · Bangkok,
            Thailand
          </div>
          <div className="text-sm text-ink-muted">
            2.5 years production experience on an enterprise GRC platform —
            end-to-end from PostgreSQL schema design to deployment. Strongest
            on permission models, data modelling, and concurrent state.
          </div>
          <div className="cs-mono mt-1.5 flex flex-wrap gap-3.5 text-xs">
            {IDENTITY_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-brand hover:text-brand-dark hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        {TAGS.map((tag) => (
          <span
            key={tag}
            className="cs-mono rounded-full border border-brand-line bg-brand-soft px-3 py-1.5 text-xs text-brand"
          >
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}

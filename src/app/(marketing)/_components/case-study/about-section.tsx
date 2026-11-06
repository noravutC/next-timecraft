import { LogoMark } from '@/components/logo-space/logo-mark';
import { ABOUT_TAGS } from './case-study-content';

export function AboutSection() {
  return (
    <section id="about" className="border-t border-line">
      <div className="mx-auto grid max-w-292 items-start gap-10 px-6 py-24 lg:grid-cols-2">
        <div className="flex flex-col gap-3.5">
          <span className="font-mono text-xs leading-6 text-brand">
            About this project
          </span>
          <p className="text-xl leading-8 tracking-tight text-pretty">
            TimeCraft is a real product I built and operate end to end: concept,
            copy, visual system, every line of interaction code, and the
            production app behind it.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ABOUT_TAGS.map((tag) => (
              <span
                key={tag}
                className="h-6.5 rounded-full border border-line px-2.5 text-xs leading-6 text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-line p-7">
          <div className="flex items-center gap-3.5">
            <LogoMark size={44} className="shrink-0" />
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">
                Noravut Chanthalay
              </span>
              <span className="text-sm leading-6 text-ink-subtle">
                Full-Stack Engineer · Next.js / React / TypeScript · Bangkok
              </span>
            </div>
          </div>
          <p className="text-base leading-5.5 text-pretty text-ink-muted">
            2.5 years of production experience on an enterprise platform,
            end to end from PostgreSQL schema design to deployment. Strongest on
            permission models, data modelling and concurrent state.
          </p>
        </div>
      </div>
    </section>
  );
}

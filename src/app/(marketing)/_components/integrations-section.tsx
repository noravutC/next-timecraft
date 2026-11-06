import { INTEGRATIONS } from './landing-content';
import { SectionIntro } from './section-intro';

export function IntegrationsSection() {
  return (
    <section id="integrations" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto grid max-w-312 items-center gap-12 px-6 py-24 lg:grid-cols-2">
        <SectionIntro
          eyebrow="Integrations"
          badge="Coming soon"
          title="Your board, wherever the work happens."
          body="These connections are on the roadmap. None of them are live yet."
        />
        <div className="grid grid-cols-4 border-t border-l border-line">
          {INTEGRATIONS.map((name) => (
            <div
              key={name}
              className="grid h-23.25 place-items-center border-r border-b border-line text-base font-medium text-ink-muted transition-colors hover:bg-surface"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

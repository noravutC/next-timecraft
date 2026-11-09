import { INTEGRATIONS } from './landing-content';
import { SectionIntro } from './section-intro';

export function IntegrationsSection() {
  return (
    <section id="integrations" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto grid max-w-312 items-center gap-12 px-6 py-24 lg:grid-cols-2">
        <SectionIntro
          eyebrow="Integrations"
          badge="More coming"
          title="Your board, wherever the work happens."
          body="Calendar is live: subscribe to a board and its due dates show up in Google Calendar, Apple Calendar or Outlook. The rest are on the roadmap."
        />
        <div className="grid grid-cols-4 border-t border-l border-line">
          {INTEGRATIONS.map(({ name, live }) => (
            <div
              key={name}
              className="flex h-23.25 flex-col items-center justify-center gap-1.5 border-r border-b border-line text-base font-medium text-ink-muted transition-colors hover:bg-surface"
            >
              {name}
              {live && (
                <span className="inline-flex h-5 items-center gap-1.5 rounded-full border border-line px-2 text-2xs font-normal text-success-text">
                  <span className="size-1.5 rounded-full bg-success-text" />
                  Live
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

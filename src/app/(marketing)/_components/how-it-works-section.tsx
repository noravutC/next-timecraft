import { STEPS } from './landing-content';
import { SectionIntro } from './section-intro';

export function HowItWorksSection() {
  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto max-w-312 px-6 py-24">
        <SectionIntro
          eyebrow="How it works"
          title="From blank board to done, in three moves."
          className="mb-12"
        />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.no}
              className="flex flex-col gap-3 rounded-xl border border-line bg-background p-7"
            >
              <span className="grid size-8 place-items-center rounded-lg border border-line font-mono text-xs">
                {step.no}
              </span>
              <h3 className="text-lead leading-6.5 font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="text-md leading-6 text-pretty text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

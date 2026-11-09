import { MarketingFooter } from '../marketing-footer';
import { LEGAL_FOOTER_NAV } from '../landing-content';
import { MarketingNav } from '../marketing-nav';
import { LEGAL_UPDATED } from './legal-facts';

export type LegalSection = {
  id: string;
  title: string;
  /** shorter name in "On this page" */
  tocLabel?: string;
  body: React.ReactNode;
};

/** Privacy and Terms: contents on the left, the text on the right. */
export function LegalPage({
  path,
  title,
  summary,
  sections,
}: {
  path: '/privacy' | '/terms';
  title: string;
  summary: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <MarketingNav links={[]} />
      <div className="mx-auto flex max-w-270 flex-wrap items-start gap-x-16 gap-y-8 px-6 pt-16 pb-24 text-md leading-6">
        <nav
          aria-label="On this page"
          className="flex max-w-55 grow basis-50 flex-col gap-0.5"
        >
          <span className="px-2 pb-1.5 text-xs font-medium text-ink-subtle">
            On this page
          </span>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex min-h-7.5 items-center rounded-md px-2 text-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              {section.tocLabel ?? section.title}
            </a>
          ))}
        </nav>

        <main className="flex max-w-170 min-w-0 grow-999 basis-140 flex-col gap-9">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-brand">Legal</span>
            <h1 className="text-heading-sm leading-11 font-semibold tracking-tighter">
              {title}
            </h1>
            <span className="text-base text-ink-subtle">
              Last updated {LEGAL_UPDATED}
            </span>
          </div>
          <div className="rounded-xl border border-line bg-surface px-5 py-4.5">
            <p className="text-ink">
              <strong className="font-semibold">In short:</strong> {summary}
            </p>
          </div>
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="flex scroll-mt-20 flex-col gap-3"
            >
              <h2 className="text-title-sm leading-7.5 font-semibold tracking-tight">
                {section.title}
              </h2>
              {section.body}
            </section>
          ))}
        </main>
      </div>
      <MarketingFooter links={LEGAL_FOOTER_NAV} current={path} />
    </>
  );
}

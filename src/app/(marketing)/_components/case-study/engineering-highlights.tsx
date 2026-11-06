import Link from 'next/link';
import { SectionIntro } from '../section-intro';
import { ENGINEERING } from './case-study-content';

const SECTION_LINKS = [
  { label: 'See the product page', href: '/timecraft' },
  { label: 'Open the live board', href: '/login' },
];

export function EngineeringHighlights() {
  return (
    <section id="highlights" className="border-t border-line bg-surface">
      <div className="mx-auto max-w-292 px-6 py-24">
        <div className="mb-10 flex flex-wrap items-end gap-4">
          <SectionIntro
            eyebrow="Engineering under the hood"
            title="What makes the board feel instant."
            className="flex-1 basis-105"
          />
          <div className="flex gap-4 text-base leading-6 font-medium">
            {SECTION_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="underline underline-offset-3 hover:text-ink-muted"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ENGINEERING.map((item) => (
            <article
              key={item.title}
              className="flex flex-col gap-2 rounded-xl border border-line bg-background p-6"
            >
              <h3 className="text-lg leading-6 font-semibold">{item.title}</h3>
              <p className="text-base leading-5.5 text-pretty text-ink-muted">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

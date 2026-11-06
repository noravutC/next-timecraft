import { NumberedGrid } from '../numbered-grid';
import { SectionIntro } from '../section-intro';
import { DECISIONS } from './case-study-content';

export function DecisionsSection() {
  return (
    <section id="decisions" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto max-w-292 px-6 py-24">
        <SectionIntro
          eyebrow="Design decisions"
          title="Restraint, so the work stands out."
          className="mb-10"
        />
        <NumberedGrid
          items={DECISIONS}
          variant="decision"
          className="md:grid-cols-3"
        />
      </div>
    </section>
  );
}

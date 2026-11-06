import { FEATURES } from './landing-content';
import { NumberedGrid } from './numbered-grid';
import { SectionIntro } from './section-intro';

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto max-w-312 px-6 py-24">
        <SectionIntro
          eyebrow="Features"
          title="A board that keeps the whole team moving."
          body="Most task apps go stale the moment someone stops updating them. TimeCraft keeps every card current, for everyone, at once."
          className="mb-12 max-w-160"
        />
        <NumberedGrid
          items={FEATURES}
          variant="feature"
          className="md:grid-cols-2"
        />
      </div>
    </section>
  );
}

export function CaseStudyHero() {
  return (
    <header className="mx-auto max-w-270 px-8 pt-12 pb-3 text-center">
      <div className="cs-mono mb-5.5 inline-block rounded-full border border-brand-line bg-brand-soft px-3 py-1.25 text-sm text-brand">
        UI engineering case study — everything below is live, drag the card
      </div>
      <h1 className="mk-display mb-4.5 text-4xl leading-none font-extrabold tracking-tight text-balance md:text-6xl">
        TimeCraft — designing
        <br />
        a board that moves.
      </h1>
      <p className="mx-auto mb-2 max-w-155 text-lg leading-normal text-pretty text-ink-muted">
        A production Kanban SaaS I designed, built, and deployed solo. This page
        shows the interaction engineering behind its marketing surface:
        hand-rolled drag physics, an optimistic-UI simulation, and a
        cursor-reactive canvas background. No libraries, no video mockups.
      </p>
      <a
        href="#board"
        className="mt-6.5 inline-flex items-center gap-3 rounded-xl bg-brand px-11 py-5 text-xl font-extrabold text-white shadow-[0_6px_22px_rgba(91,80,230,0.30)] transition-colors hover:bg-brand-dark hover:shadow-[0_8px_28px_rgba(91,80,230,0.40)]"
      >
        <span aria-hidden>▶</span> Try the live demo
      </a>
    </header>
  );
}

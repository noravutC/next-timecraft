const DECISIONS = [
  {
    tag: 'motion',
    title: 'One hero moment, not scattered fades',
    body: 'All motion budget went to the draggable card — the product’s core verb. Scroll reveals appear only where they explain sequence. Reduced-motion is respected end to end.',
  },
  {
    tag: 'background',
    title: 'A grid, not a gradient blob',
    body: 'The ambient layer is an isometric dot grid on canvas — cursor-lit, cached offscreen for one blit per frame. It quotes the board metaphor instead of decorating around it.',
  },
  {
    tag: 'type & color',
    title: 'Purple system, mono metadata',
    body: 'Bricolage Grotesque for voice, Space Mono for card IDs and timestamps — the “craft/tooling” cue. One purple ramp on near-white; no invented accent colors.',
  },
];

export function DecisionsSection() {
  return (
    <section id="decisions" className="mx-auto max-w-270 px-8 pt-20 pb-6">
      <h2 className="mk-display mb-10 text-center text-4xl font-extrabold tracking-tight">
        Design decisions
      </h2>
      <div className="grid gap-5 md:grid-cols-3">
        {DECISIONS.map((d) => (
          <div
            key={d.tag}
            className="rounded-2xl border border-line bg-white p-6.5"
          >
            <div className="cs-mono mb-4 inline-block rounded-md bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
              {d.tag}
            </div>
            <h3 className="mk-display mb-2.5 text-lg font-bold">{d.title}</h3>
            <p className="text-sm leading-relaxed text-ink-muted">{d.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

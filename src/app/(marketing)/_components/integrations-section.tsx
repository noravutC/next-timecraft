const TILES = [
  'Calendar',
  'Slack',
  'Notion',
  'GitHub',
  null, // center tile — TimeCraft mark
  'Figma',
  'Stripe',
  'Zapier',
  'Toggl',
];

export function IntegrationsSection() {
  return (
    <section
      id="integrations"
      className="mx-auto max-w-6xl scroll-mt-20 px-7 py-14"
    >
      <div className="grid items-center gap-10 overflow-x-clip rounded-3xl border border-line bg-white p-9 lg:grid-cols-2 lg:p-14">
        <div className="mk-reveal-left">
          <div className="mb-3.5 font-mono text-xs tracking-widest text-brand">
            INTEGRATIONS — ON THE ROADMAP
          </div>
          <h2 className="mk-display mb-4 text-3xl leading-tight font-bold tracking-tight text-balance md:text-4xl">
            Your board, wherever the work happens.
          </h2>
          <p className="mb-5 text-lg leading-relaxed text-ink-muted">
            Integrations aren&apos;t here yet — they&apos;re next on the list.
            The plan: two-way sync with your calendar, chat, and repos, so a
            card can start from a Slack message or a GitHub issue and still land
            on your board.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs tracking-widest text-ink-muted">
            <span className="mk-pulse-dot size-2 rounded-full bg-amber-500" />
            COMING SOON
          </div>
        </div>
        <div className="mk-reveal-right grid grid-cols-3 gap-3">
          {TILES.map((tile) =>
            tile ? (
              <div
                key={tile}
                className="mk-display flex aspect-square items-center justify-center rounded-2xl bg-surface p-2 text-center text-sm font-bold text-ink-subtle opacity-70 transition-all duration-200 hover:scale-105 hover:bg-surface-active hover:opacity-100"
              >
                {tile}
              </div>
            ) : (
              <div
                key="timecraft"
                className="flex aspect-square items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-label="TimeCraft"
                >
                  <rect
                    x="4"
                    y="12"
                    width="3.4"
                    height="8"
                    rx="1.2"
                    fill="#fff"
                  />
                  <rect
                    x="10.3"
                    y="6"
                    width="3.4"
                    height="14"
                    rx="1.2"
                    fill="#fff"
                  />
                  <rect
                    x="16.6"
                    y="9"
                    width="3.4"
                    height="11"
                    rx="1.2"
                    fill="#fff"
                  />
                </svg>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

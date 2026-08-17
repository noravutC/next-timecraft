import Link from 'next/link';

const HIGHLIGHTS = [
  {
    tag: 'ordering',
    title: 'Fractional indexing',
    body: 'A card move writes one row, not a renumbered column: each card keys into a fraction string between its neighbours. The same scheme orders columns and tasks.',
  },
  {
    tag: 'state',
    title: 'Optimistic UI + rollback',
    body: 'Every mutation snapshots the store, applies instantly, and reverts if the API call fails. The snapshot-and-revert cycle is unit-tested.',
  },
  {
    tag: 'authz',
    title: 'Multi-tenant RBAC',
    body: 'Permissions are a typed union mapped to role sets, enforced at the API layer through a single authorize() gate, with no ad-hoc role checks in routes.',
  },
  {
    tag: 'ai',
    title: 'AI task breakdown',
    body: 'A goal streams back from the Claude API over SSE, one subtask per line. Each line is validated with Zod before it ever reaches the board.',
  },
  {
    tag: 'ship',
    title: 'Owned deploy path',
    body: 'GitHub Actions builds a multi-stage Docker image, pushes it to GHCR, and an EC2 box pulls it behind Caddy auto-HTTPS, tuned for a memory-constrained instance.',
  },
];

const SECTION_LINKS = [
  { label: 'See the product page →', href: '/timecraft' },
  { label: 'Open the live board →', href: '/login' },
];

export function EngineeringHighlights() {
  return (
    <section id="highlights" className="mx-auto max-w-270 px-8 pt-20 pb-6">
      <h2 className="mk-display mb-10 text-center text-4xl font-extrabold tracking-tight">
        Engineering under the hood
      </h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {HIGHLIGHTS.map((h) => (
          <div
            key={h.tag}
            className="rounded-2xl border border-line bg-white p-6.5"
          >
            <div className="cs-mono mb-4 inline-block rounded-md bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
              {h.tag}
            </div>
            <h3 className="mk-display mb-2.5 text-lg font-bold">{h.title}</h3>
            <p className="text-sm leading-relaxed text-ink-muted">{h.body}</p>
          </div>
        ))}
      </div>
      <div className="cs-mono mt-8 flex flex-wrap justify-center gap-6 text-sm">
        {SECTION_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-bold text-brand hover:text-brand-dark hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

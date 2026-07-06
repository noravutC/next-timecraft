const STEPS = [
  {
    number: '01',
    numberClass: 'bg-brand',
    title: 'Set up your board',
    body: 'Sign in with Google — or jump in as a guest, no account needed. Create a project, add lanes, and drop in your first cards with an estimate.',
  },
  {
    number: '02',
    numberClass: 'bg-amber-500',
    title: 'Work it together',
    body: 'Drag cards as work moves, assign teammates, set priorities and due dates, and talk it out in comments right on the task.',
  },
  {
    number: '03',
    numberClass: 'bg-emerald-600',
    title: 'Let AI unblock you',
    body: 'Hand a fuzzy card to the AI breakdown and get clear subtasks back in seconds. Log your hours as you close things out.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-6xl px-7 py-14">
      <div className="mk-reveal mb-12 text-center">
        <div className="mb-3.5 font-mono text-xs tracking-widest text-brand">
          HOW IT WORKS
        </div>
        <h2 className="mk-display text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl">
          From blank board to done — in three moves.
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number} className="mk-reveal">
            <div
              className={`mk-display mb-4 flex size-10 items-center justify-center rounded-xl text-md font-bold text-white ${step.numberClass}`}
            >
              {step.number}
            </div>
            <h3 className="mk-display mb-2 text-xl font-bold tracking-tight">
              {step.title}
            </h3>
            <p className="text-md leading-relaxed text-ink-muted">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

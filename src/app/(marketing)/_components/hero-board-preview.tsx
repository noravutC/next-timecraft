import { CircleCheck } from 'lucide-react';

const DoneTask = ({ label }: { label: string }) => (
  <div className="flex items-center gap-1.5">
    <CircleCheck className="size-3.5 shrink-0 fill-emerald-600 text-white" />
    <span className="text-xs font-semibold text-ink-muted line-through">
      {label}
    </span>
  </div>
);

/** Decorative animated kanban mock for the hero — not the real board. */
export function HeroBoardPreview() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="relative grid grid-cols-3 gap-3 rounded-2xl border border-line bg-white p-4 shadow-[0_30px_60px_-24px_rgba(29,30,38,0.28)]">
        {/* To do */}
        <div className="min-h-[250px] rounded-xl bg-surface p-3">
          <div className="mb-3 flex items-center justify-between font-mono text-xs tracking-wider text-ink-subtle">
            <span>TO DO</span>
            <span>3</span>
          </div>
          <div className="mk-float-a mb-2 rounded-lg border border-line bg-white p-3">
            <div className="mb-2 inline-block rounded-md bg-surface-active px-2 py-0.5 font-mono text-xs text-ink-subtle">
              BRANDING
            </div>
            <div className="text-xs leading-snug font-semibold">
              Logo concepts round 2
            </div>
            <div className="mt-2 text-xs text-ink-subtle">est. 3h</div>
          </div>
          <div className="h-14 rounded-lg border border-dashed border-ink-faint/60 bg-white" />
        </div>

        {/* In progress */}
        <div className="min-h-[250px] rounded-xl bg-amber-50 p-3">
          <div className="mb-3 flex items-center justify-between font-mono text-xs tracking-wider text-amber-600">
            <span>IN PROGRESS</span>
            <span className="mk-pulse-dot size-2 rounded-full bg-amber-500" />
          </div>
          <div className="rounded-lg border border-amber-300 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-1">
              <div className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-xs text-amber-600">
                WEBSITE
              </div>
              <div className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-xs font-semibold text-amber-600">
                HIGH
              </div>
            </div>
            <div className="text-xs leading-snug font-semibold">
              Hero section build
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-xs text-amber-600">
              <span>SUBTASKS</span>
              <span>2/3</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-amber-100">
              <div className="h-full w-2/3 rounded-full bg-amber-500" />
            </div>
          </div>
        </div>

        {/* Done */}
        <div className="min-h-[250px] rounded-xl bg-emerald-50 p-3">
          <div className="mb-3 flex items-center justify-between font-mono text-xs tracking-wider text-emerald-600">
            <span>DONE</span>
            <span>5</span>
          </div>
          <div className="mk-float-b mb-2 rounded-lg border border-emerald-200 bg-white p-3">
            <DoneTask label="Wireframes" />
            <div className="mt-2 font-mono text-xs text-emerald-600">
              3h logged
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-3">
            <DoneTask label="Kickoff call" />
          </div>
        </div>

        {/* dragging ghost card */}
        <div className="mk-drag absolute top-11 left-5 z-10 w-32 rounded-lg border border-brand/40 bg-white p-3">
          <div className="mb-2 inline-block rounded-md bg-brand-soft px-2 py-0.5 font-mono text-xs text-brand">
            CLIENT
          </div>
          <div className="text-xs leading-snug font-semibold">
            Send weekly update
          </div>
          <div className="mt-2 text-xs text-ink-subtle">est. 1h</div>
        </div>
      </div>

      {/* floating stat chip */}
      <div className="mk-float-b absolute -bottom-5 -left-5 rounded-xl bg-ink px-4 py-3 text-white shadow-[0_16px_34px_rgba(29,30,38,0.3)]">
        <div className="flex items-center gap-1.5 font-mono text-xs tracking-wider text-ink-faint">
          <span className="mk-pulse-dot size-1.5 rounded-full bg-emerald-400" />
          THIS WEEK
        </div>
        <div className="mk-display text-xl font-bold">
          12h <span className="text-brand">logged</span>
        </div>
      </div>
    </div>
  );
}

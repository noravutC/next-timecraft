import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** One step of a rule: its mark on the rail, its name, and what is in it. */
export const RuleStep = ({
  icon: Icon,
  title,
  hint,
  optional = false,
  last = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  /** beside the title, in the quiet color */
  hint?: string;
  /** drawn lighter: the rule works without it */
  optional?: boolean;
  /** no rail below the last step */
  last?: boolean;
  children: ReactNode;
}) => (
  <section aria-label={title} className="flex gap-3">
    <div aria-hidden className="flex w-7 shrink-0 flex-col items-center">
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full',
          optional
            ? 'border border-line-strong bg-background text-ink-muted'
            : 'bg-ink text-background',
        )}
      >
        <Icon className="size-3.5" />
      </span>
      {!last && <span className="my-1 w-px flex-1 bg-line" />}
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-2 pb-5">
      <h3 className="flex h-7 items-center gap-1.5 text-sm font-semibold text-ink">
        {title}
        {hint && <span className="font-normal text-ink-subtle">{hint}</span>}
      </h3>
      {children}
    </div>
  </section>
);

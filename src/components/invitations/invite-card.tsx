import type { ReactNode } from 'react';

interface InviteCardProps {
  tile: ReactNode;
  title: string;
  /** One or two sentences; wrap names in <strong>. */
  children: ReactNode;
  action: ReactNode;
}

/** White card with a 44px tile, a title, a short explanation and one action. */
export const InviteCard = ({
  tile,
  title,
  children,
  action,
}: InviteCardProps) => (
  <section className="flex flex-col gap-5 rounded-xl border border-line bg-background p-7 shadow-card">
    {tile}
    <div className="flex flex-col gap-1.5">
      <h1 className="text-title-sm font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="text-base leading-5.5 text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink">
        {children}
      </p>
    </div>
    {action}
  </section>
);

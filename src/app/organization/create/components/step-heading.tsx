import type { ReactNode } from "react";

type StepHeadingProps = {
  title: string;
  children: ReactNode;
};

/** Title + one-line explanation at the top of each setup step. */
export function StepHeading({ title, children }: StepHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-title font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="text-md text-ink-muted">{children}</p>
    </div>
  );
}

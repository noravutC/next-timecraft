import { Activity } from 'lucide-react';

/** One sentence on the week so far, above the numbers. */
export const InsightsSummary = ({ text }: { text: string }) => (
  <p className="flex items-start gap-2.5 rounded-xl bg-brand-soft px-4 py-3 text-base text-ink">
    <Activity aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
    <span>
      <span className="font-semibold">This week so far:</span> {text}
    </span>
  </p>
);

import { ChartColumn, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COPY = {
  // a Done column, but nothing has reached it yet
  nothing: {
    icon: ChartColumn,
    title: 'Nothing finished yet',
    body: 'A task is counted here when it reaches the Done column. The charts appear after the first one.',
    action: 'Back to the board',
    variant: 'outline',
  },
  // no Done column: nothing can be counted as finished
  'no-done': {
    icon: CircleCheck,
    title: 'This board has no Done column',
    body: 'Insights count a task as finished when it reaches the Done column. Open a column’s menu on the board and turn on Done column, and the numbers start from there.',
    action: 'Go to the board',
    variant: 'default',
  },
} as const;

/** In place of the charts while there is nothing to count; fills the page. */
export const InsightsEmpty = ({
  kind,
  onBoard,
}: {
  kind: keyof typeof COPY;
  onBoard: () => void;
}) => {
  const copy = COPY[kind];
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-line-strong bg-background px-6 py-18 text-center">
      <span
        aria-hidden
        className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-ink-muted"
      >
        <copy.icon className="size-4.5" />
      </span>
      <h2 className="mt-1 text-copy font-semibold text-ink">{copy.title}</h2>
      <p className="max-w-110 text-sm leading-5 text-ink-muted">{copy.body}</p>
      <Button
        size="sm"
        variant={copy.variant}
        onClick={onBoard}
        className="mt-2"
      >
        {copy.action}
      </Button>
    </section>
  );
};

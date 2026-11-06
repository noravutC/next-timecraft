import { cn } from '@/lib/utils';

export interface NumberedItem {
  no: string;
  title: string;
  body: string;
}

const CELL_STYLES = {
  /** product features: roomier cells, 20px titles */
  feature: { cell: 'p-8', title: 'text-xl leading-7' },
  /** case-study decisions: 18px titles */
  decision: { cell: 'p-7', title: 'text-lead leading-6.5' },
} as const;

interface NumberedGridProps {
  items: NumberedItem[];
  variant: keyof typeof CELL_STYLES;
  /** Column count, e.g. md:grid-cols-2. */
  className?: string;
}

/** Hairline grid of numbered cells: borders meet like a table, no cards. */
export function NumberedGrid({ items, variant, className }: NumberedGridProps) {
  const styles = CELL_STYLES[variant];
  return (
    <div className={cn('grid border-t border-l border-line', className)}>
      {items.map((item) => (
        <article
          key={item.no}
          className={cn(
            'flex flex-col gap-2.5 border-r border-b border-line',
            styles.cell,
          )}
        >
          <span className="font-mono text-xs leading-6 text-ink-subtle">
            {item.no}
          </span>
          <h3 className={cn('font-semibold tracking-tight', styles.title)}>
            {item.title}
          </h3>
          <p className="text-md leading-6 text-pretty text-ink-muted">
            {item.body}
          </p>
        </article>
      ))}
    </div>
  );
}

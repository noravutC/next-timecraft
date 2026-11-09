import { cn } from '@/lib/utils';
import type { BoardTemplate } from '@/helper/default-project';

/** Mini board: one lane per column, topped with the column color. */
export const TemplatePreview = ({
  columns,
  size = 'md',
}: {
  columns: BoardTemplate['columns'];
  /** md 38px (dialog) · lg 44px (first board page) */
  size?: 'md' | 'lg';
}) => (
  <span
    aria-hidden="true"
    className={cn(
      'flex gap-1 rounded-md border border-line-soft bg-surface p-1',
      size === 'md' ? 'h-9.5' : 'h-11',
    )}
  >
    {columns.map((column) => (
      <span
        key={column.name}
        className={cn(
          'flex flex-1 flex-col gap-0.75 rounded-xs border-t-2 bg-background px-0.75',
          size === 'md' ? 'py-1' : 'py-1.25',
        )}
        style={{ borderTopColor: column.color }}
      >
        <span className="h-0.75 w-4/5 rounded-xs bg-line" />
        <span className="h-0.75 w-11/20 rounded-xs bg-line" />
      </span>
    ))}
  </span>
);

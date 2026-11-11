import { cn } from '@/lib/utils';

/**
 * A column's mark: its color dot, or a check in that color when it is the
 * board's Done column. The check is wider than the dot, so callers that
 * need both to line up pass a negative margin for it in `doneClassName`.
 */
export const ColumnMark = ({
  color,
  done = false,
  className,
  doneClassName,
}: {
  color: string | null | undefined;
  done?: boolean;
  className?: string;
  doneClassName?: string;
}) =>
  done ? (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Done column"
      className={cn('size-3.5 shrink-0', doneClassName)}
    >
      <circle cx="12" cy="12" r="11" fill={color ?? '#94A3B8'} />
      <path
        d="m7.5 12.5 3 3 6-6.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <span
      className={cn('size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color ?? '#94A3B8' }}
    />
  );

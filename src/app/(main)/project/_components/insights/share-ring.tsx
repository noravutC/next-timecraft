import { cn } from '@/lib/utils';

/** A ring filled to a share of the whole: a number from 0 to 100 as a picture. */
export const ShareRing = ({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) => (
  <svg
    viewBox="0 0 56 56"
    aria-hidden
    className={cn('size-14 shrink-0 -rotate-90 fill-none', className)}
  >
    <circle
      cx="28"
      cy="28"
      r="22"
      strokeWidth="7"
      className="stroke-surface-active"
    />
    {percent > 0 && (
      <circle
        cx="28"
        cy="28"
        r="22"
        strokeWidth="7"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${percent} 100`}
        className="stroke-success"
      />
    )}
  </svg>
);

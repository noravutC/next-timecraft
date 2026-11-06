import { cn } from '@/lib/utils';

/** Thin slanted divider between breadcrumb parts (logo / workspace / board). */
export const BreadcrumbSlash = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden
    className={cn('size-4.5 shrink-0 fill-none stroke-line-strong', className)}
    strokeWidth={1.5}
    strokeLinecap="round"
  >
    <path d="M15 4 9 20" />
  </svg>
);

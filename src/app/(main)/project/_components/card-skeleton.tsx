import { Skeleton } from '@/components/ui/skeleton';

/** Card-shaped placeholder while a column loads: two title lines, a tag, an avatar. */
export const CardSkeleton = () => (
  <div
    aria-hidden
    className="flex flex-col gap-2.5 rounded-lg border border-line bg-background p-3"
  >
    <Skeleton className="h-3 w-17/20 rounded-sm" />
    <Skeleton className="h-3 w-11/20 rounded-sm" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-4.5 w-14 rounded-full" />
      <div className="flex-1" />
      <Skeleton className="size-5 rounded-full" />
    </div>
  </div>
);

import { Skeleton } from '@/components/ui/skeleton';

/** The page's outline while the numbers load. */
export const InsightsSkeleton = () => (
  <div role="status" aria-label="Loading insights" className="contents">
    <Skeleton className="h-11 rounded-xl" />
    <div className="flex flex-wrap gap-3 pt-6">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-31 flex-1 basis-37.5 rounded-xl" />
      ))}
    </div>
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-93 grow-999 basis-140 rounded-xl" />
      <Skeleton className="h-93 grow basis-85 rounded-xl" />
    </div>
  </div>
);

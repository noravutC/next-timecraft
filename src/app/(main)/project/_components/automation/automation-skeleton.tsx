import { Skeleton } from '@/components/ui/skeleton';

/** The page's outline while the rules load. */
export const AutomationSkeleton = () => (
  <div role="status" aria-label="Loading automation" className="contents">
    <Skeleton className="h-11 rounded-xl" />
    <div className="flex flex-wrap gap-4 pt-6">
      <Skeleton className="h-96 grow-3 basis-155 rounded-xl" />
      <Skeleton className="h-64 grow basis-80 rounded-xl" />
    </div>
  </div>
);

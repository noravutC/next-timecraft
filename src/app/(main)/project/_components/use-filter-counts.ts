import { useCallback, useState } from 'react';
import { taskServices, type FilterCounts } from '@/services/tasks.service';
import { dueBounds } from '@/helper/utils/due-filter';

/** Counts for the Due date and Assignee menus, fetched when one opens. */
export function useFilterCounts(columnIds: string[]) {
  const [counts, setCounts] = useState<FilterCounts | null>(null);
  const key = columnIds.join(',');
  const refresh = useCallback(() => {
    if (!key) return;
    taskServices
      .getFilterCounts(key.split(','), dueBounds())
      .then(setCounts)
      .catch(() => {});
  }, [key]);
  return { counts, refresh };
}

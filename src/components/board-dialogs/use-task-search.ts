'use client';

import { useEffect, useState } from 'react';
import { searchServices } from '@/services/search.service';
import type { TaskSearchHit } from '@/types';

const DEBOUNCE_MS = 200;
const MIN_LENGTH = 2;

/** Tasks matching what's typed in ⌘K, a moment after typing stops. */
export function useTaskSearch(query: string, projectId: string | null) {
  const [hits, setHits] = useState<TaskSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (q.length < MIN_LENGTH) {
      setHits([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      searchServices
        .searchTasks(q, projectId, controller.signal)
        .then(({ data }) => setHits(data))
        .catch(() => {
          if (!controller.signal.aborted) setHits([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, projectId]);

  return { hits, searching, active: q.length >= MIN_LENGTH };
}

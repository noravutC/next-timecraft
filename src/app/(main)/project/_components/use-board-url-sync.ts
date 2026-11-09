'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useProjectStore } from '@/store';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { useOpenTask } from '@/components/task-detail/use-open-task';
import { useShallow } from 'zustand/react/shallow';
import {
  selectBoardFilter,
  useBoardFilterStore,
} from '@/store/use-board-filter.store';
import {
  boardUrl,
  readBoardUrl,
  type BoardUrlState,
} from '@/helper/utils/board-url';
import { readFilterUrl } from '@/helper/utils/filter-url';
import type { BoardFilterState } from '@/types';

type RequestedState = BoardUrlState & { filter: BoardFilterState };

/**
 * Keeps `/project?board=&task=` (and the board filter) and the open board
 * and task in step.
 * On the first load it opens the board (and task) the URL names. After that,
 * every board switch or opened task rewrites the URL, so a reload or a copied
 * address lands in the same place.
 */
export function useBoardUrlSync() {
  const searchParams = useSearchParams();
  const projects = useProjectStore((s) => s.projects);
  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const needCreateProject = useProjectStore((s) => s.needCreateProject);
  const ensureActiveProject = useProjectStore((s) => s.ensureActiveProject);
  const openTaskId = useTaskDetailStore((s) => s.openTaskId);
  const openTask = useOpenTask();

  const filter = useBoardFilterStore(useShallow(selectBoardFilter));

  // what the URL asked for when the page loaded; read once
  const requested = useRef<RequestedState | null>(null);
  if (requested.current === null)
    requested.current = {
      ...readBoardUrl(searchParams),
      filter: readFilterUrl(searchParams),
    };
  const [applied, setApplied] = useState(false);
  const loaded = Object.keys(projects).length > 0;

  // the link's filter, before the first tasks are fetched
  useEffect(() => {
    if (requested.current) {
      useBoardFilterStore.getState().replace(requested.current.filter);
    }
  }, []);

  // keep a board open; until the URL is applied, prefer the one it names
  useEffect(() => {
    if (needCreateProject) return;
    ensureActiveProject(applied ? null : requested.current?.board);
  }, [needCreateProject, projects, applied, ensureActiveProject]);

  // URL → app, once the board list is in
  useEffect(() => {
    if (!loaded || applied) return;
    const { board, task } = requested.current ?? { board: null, task: null };
    if (board && !projects[board] && !task) {
      toast.error('That board isn’t available');
    }
    if (!task) {
      setApplied(true);
      return;
    }
    void openTask(task).finally(() => setApplied(true));
  }, [loaded, applied, projects, openTask]);

  // app → URL. replaceState keeps Next's router in sync without a navigation
  useEffect(() => {
    if (!applied) return;
    const next = boardUrl({ board: projectIsUsing, task: openTaskId, filter });
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) window.history.replaceState(null, '', next);
  }, [applied, projectIsUsing, openTaskId, filter]);
}

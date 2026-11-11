'use client';

import { useEffect, useRef, useState } from 'react';
import { projectServices } from '@/services/projects.service';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import type { InsightWeeks } from '@/helper/utils/insights';
import { browserTimeZone } from '@/helper/utils/time-zone';
import type { BoardInsights } from '@/types';

/** A board's Insights for the chosen period, in the browser's time zone. */
export function useInsights(projectId: string | null) {
  const [weeks, setWeeks] = useState<InsightWeeks>(12);
  const [loaded, setLoaded] = useState<{
    projectId: string;
    data: BoardInsights;
  } | null>(null);
  const [timeZone] = useState(browserTimeZone);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // a task changed in the sheet can change the numbers: reload when it closes
  const sheetOpen = useTaskDetailStore((s) => s.openTaskId !== null);
  const sheetWasOpen = useRef(false);
  useEffect(() => {
    if (sheetWasOpen.current && !sheetOpen) setAttempt((n) => n + 1);
    sheetWasOpen.current = sheetOpen;
  }, [sheetOpen]);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    projectServices
      .getInsights(projectId, { weeks, timeZone })
      .then((data) => {
        if (!active) return;
        setLoaded({ projectId, data });
        setFailed(false);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [projectId, weeks, timeZone, attempt]);

  return {
    weeks,
    setWeeks,
    /** the zone the weeks and days are counted in */
    timeZone,
    // another board's numbers are never shown while this one's load
    data: loaded?.projectId === projectId ? loaded.data : null,
    failed,
    retry: () => {
      setFailed(false);
      setAttempt((n) => n + 1);
    },
  };
}

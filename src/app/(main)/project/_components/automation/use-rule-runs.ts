'use client';

import { useEffect, useState } from 'react';
import { browserTimeZone } from '@/helper/utils/time-zone';
import { automationServices } from '@/services/automation.service';
import type { HistoryItem } from '@/types';
import { recentRuns } from './history-operations';

/** The last few times a rule ran; empty for a rule that is not saved yet. */
export function useRuleRuns(projectId: string | null, ruleId: string | null) {
  const [loaded, setLoaded] = useState<{
    ruleId: string;
    items: HistoryItem[];
  } | null>(null);
  const [timeZone] = useState(browserTimeZone);

  useEffect(() => {
    if (!projectId || !ruleId) return;
    let active = true;
    automationServices
      .getHistory(projectId, { kind: 'rules', failedOnly: false, ruleId })
      .then((page) => active && setLoaded({ ruleId, items: page.items }))
      // the editor works without them
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [projectId, ruleId]);

  return loaded?.ruleId === ruleId
    ? recentRuns(loaded.items, new Date(), timeZone)
    : [];
}

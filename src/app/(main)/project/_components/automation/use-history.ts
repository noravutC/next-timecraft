'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { browserTimeZone } from '@/helper/utils/time-zone';
import { automationServices } from '@/services/automation.service';
import type { HistoryItem } from '@/types';
import { historyDays } from './history-operations';

export type HistoryKind = 'all' | 'rules' | 'webhooks';

/** A board's History, a page at a time, for the filter that is picked. */
export function useHistory(projectId: string | null, active: boolean) {
  const [kind, setKind] = useState<HistoryKind>('all');
  const [failedOnly, setFailedOnly] = useState(false);
  const [timeZone] = useState(browserTimeZone);
  const [page, setPage] = useState<{
    key: string;
    items: HistoryItem[];
    nextCursor: string | null;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const key = `${projectId}:${kind}:${failedOnly}`;

  useEffect(() => {
    if (!projectId || !active) return;
    let live = true;
    automationServices
      .getHistory(projectId, { kind, failedOnly })
      .then((data) => {
        if (!live) return;
        setPage({ key, ...data });
        setFailed(false);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [projectId, active, kind, failedOnly, key, reload]);

  // another filter's rows are never shown while this one's load
  const current = page?.key === key ? page : null;

  const loadMore = async () => {
    if (!projectId || !current?.nextCursor) return;
    setBusy('more');
    try {
      const data = await automationServices.getHistory(projectId, {
        kind,
        failedOnly,
        cursor: current.nextCursor,
      });
      setPage((p) =>
        p?.key === key
          ? {
              key,
              items: [...p.items, ...data.items],
              nextCursor: data.nextCursor,
            }
          : p,
      );
    } catch {
      toast.error('Could not load more');
    } finally {
      setBusy(null);
    }
  };

  const resend = async (deliveryId: string) => {
    if (!projectId) return;
    setBusy(deliveryId);
    try {
      await automationServices.redeliver(projectId, deliveryId);
      setReload((n) => n + 1);
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ?? 'Could not send it again',
      );
    } finally {
      setBusy(null);
    }
  };

  return {
    kind,
    setKind,
    failedOnly,
    setFailedOnly,
    loaded: current !== null,
    failed: failed && current === null,
    retry: () => setReload((n) => n + 1),
    days: current ? historyDays(current.items, new Date(), timeZone) : [],
    hasMore: Boolean(current?.nextCursor),
    loadMore,
    resend,
    /** the delivery being sent again, or 'more' while the next page loads */
    busy,
  };
}

export type History = ReturnType<typeof useHistory>;

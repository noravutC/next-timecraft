import { useEffect, useState } from 'react';
import { accountServices } from '@/services/account.service';
import type { DailyUsage } from '@/helper/utils/usage-meters';

/** The last 24 hours of each daily limit, read when the page opens. */
export function useDailyUsage() {
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    accountServices
      .getUsage()
      .then((data) => active && setUsage(data))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);
  return { usage, failed };
}

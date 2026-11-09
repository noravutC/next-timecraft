/** One log can't be longer than a day. */
export const MAX_LOG_MINUTES = 24 * 60;

/**
 * Minutes from what people type: "45m", "2h", "1h 30m", "1.5h", or a bare
 * number of minutes. Null for anything else, zero, or more than a day.
 */
export const parseDuration = (text: string): number | null => {
  const input = text.trim().toLowerCase();
  if (!input) return null;
  let minutes: number;
  if (/^\d+$/.test(input)) {
    minutes = Number(input);
  } else {
    const match = /^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+)\s*m)?$/.exec(input);
    if (!match || (!match[1] && !match[2])) return null;
    minutes = Math.round(Number(match[1] ?? 0) * 60) + Number(match[2] ?? 0);
  }
  return minutes > 0 && minutes <= MAX_LOG_MINUTES ? minutes : null;
};

/** "3h 20m", "45m", "2h"; nothing logged is "0m". */
export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/** How much of the estimate is spent, capped at full; 0 with no estimate. */
export const spentPercent = (minutes: number, estimateHours: number): number =>
  estimateHours > 0
    ? Math.min(100, Math.round((minutes / (estimateHours * 60)) * 100))
    : 0;

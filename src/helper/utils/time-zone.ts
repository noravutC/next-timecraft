/** Is this an IANA time zone the runtime knows, like "Asia/Bangkok"? */
export const isTimeZone = (tz: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/** Minutes ahead of UTC in that zone at that moment (follows daylight time). */
export const timeZoneOffsetMinutes = (tz: string, at: Date): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const wallClockAsUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  const atSecond = Math.floor(at.getTime() / 1000) * 1000;
  return Math.round((wallClockAsUtc - atSecond) / 60_000);
};

/** "GMT+07:00", "GMT-04:00", "GMT+05:30" */
export const formatGmtOffset = (minutes: number): string => {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, '0');
  return `GMT${sign}${hours}:${String(abs % 60).padStart(2, '0')}`;
};

/** "Asia/Ho_Chi_Minh" → "Ho Chi Minh", "UTC" → "UTC" */
export const timeZoneCity = (tz: string): string =>
  (tz.split('/').pop() ?? tz).replace(/_/g, ' ');

/** "(GMT+07:00) Bangkok" */
export const timeZoneLabel = (tz: string, at: Date = new Date()): string =>
  `(${formatGmtOffset(timeZoneOffsetMinutes(tz, at))}) ${timeZoneCity(tz)}`;

export type TimeZoneOption = { value: string; label: string; offset: number };

/** Every zone the runtime knows, west to east, labeled for a picker. */
export const timeZoneOptions = (at: Date = new Date()): TimeZoneOption[] => {
  const zones = Intl.supportedValuesOf('timeZone');
  return (zones.includes('UTC') ? zones : ['UTC', ...zones])
    .map((tz) => ({
      value: tz,
      label: timeZoneLabel(tz, at),
      offset: timeZoneOffsetMinutes(tz, at),
    }))
    .sort((a, b) => a.offset - b.offset || a.label.localeCompare(b.label));
};

/** The zone this browser is in, or UTC when it can't tell. */
export const browserTimeZone = (): string => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return tz && isTimeZone(tz) ? tz : 'UTC';
};

/** Zones whose label or id contains the query: "bangkok", "gmt+07", "asia/". */
export const filterTimeZones = (
  options: TimeZoneOption[],
  query: string,
): TimeZoneOption[] => {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (o) =>
      o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
  );
};

/** The calendar day a moment falls on in that zone. */
export const zonedDay = (
  at: Date,
  tz: string,
): { year: number; month: number; day: number } => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: part('year'), month: part('month'), day: part('day') };
};

/** The moment it's that wall-clock time in that zone (daylight time included). */
export const zonedTimeToUtc = (
  date: { year: number; month: number; day: number },
  hour: number,
  tz: string,
): Date => {
  const asUtc = Date.UTC(date.year, date.month - 1, date.day, hour);
  // twice: the first guess can sit on the other side of a clock change
  const first = asUtc - timeZoneOffsetMinutes(tz, new Date(asUtc)) * 60_000;
  return new Date(asUtc - timeZoneOffsetMinutes(tz, new Date(first)) * 60_000);
};

/** `days` calendar days after a date (negative for before). */
export const addDays = (
  date: { year: number; month: number; day: number },
  days: number,
): { year: number; month: number; day: number } => {
  const moved = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: moved.getUTCFullYear(),
    month: moved.getUTCMonth() + 1,
    day: moved.getUTCDate(),
  };
};

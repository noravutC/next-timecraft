const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = date instanceof Date ? date : new Date(date);

  return d.toLocaleDateString("en-US", {
    month: "short", // Aug
    day: "2-digit", // 18
    year: "numeric", // 2025
  });
}
export const formatRelativePast = (date: Date) => {
  const ms = Date.now() - date.getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString();
};

/** จำนวนวันจากวันนี้ถึง date (ติดลบ = เลยมาแล้ว), เทียบที่เที่ยงคืน */
export const daysUntil = (
  date: string | Date,
  now: Date = new Date(),
): number => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
};

export type DueUrgency = "overdue" | "soon" | "normal";

/** ความเร่งด่วนของวันครบกำหนด: เลยแล้ว = overdue, เหลือ ≤ 2 วัน = soon */
export const dueUrgency = (daysLeft: number): DueUrgency =>
  daysLeft < 0 ? "overdue" : daysLeft <= 2 ? "soon" : "normal";

export const formatRelativeDay = (d: Date) => {
  const diffDays = daysUntil(d);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

/**
 * Due date on a card: Today / Tomorrow / Yesterday, otherwise "Nov 12"
 * (with the year only when it isn't this year).
 */
export const formatDueLabel = (date: Date, now: Date = new Date()): string => {
  const diff = daysUntil(date, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatMonthDay(date, now);
};

/** "Nov 12", with the year only when it isn't this year: "Jan 3, 2027". */
export const formatMonthDay = (date: Date, now: Date = new Date()): string =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });

/** Quick picks in the due-date menu, counted from `today` (midnight). */
export const dueDatePresets = (
  today: Date = new Date(),
): { label: string; date: Date }[] => {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const plus = (days: number) => {
    const d = new Date(start);
    d.setDate(start.getDate() + days);
    return d;
  };
  // next Monday, never today: Monday → the following Monday
  const toMonday = (1 + 7 - start.getDay()) % 7 || 7;
  return [
    { label: "Today", date: plus(0) },
    { label: "Tomorrow", date: plus(1) },
    { label: "In 3 days", date: plus(3) },
    { label: "Next Monday", date: plus(toMonday) },
    { label: "In 2 weeks", date: plus(14) },
  ];
};

/** yyyy-mm-dd for <input type="date">, in local time. */
export const toDateInputValue = (d: Date | null): string => {
  if (!d) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/** Parse an <input type="date"> value as a local date (null when empty). */
export const fromDateInputValue = (value: string): Date | null => {
  if (!value) return null;
  const [yyyy, mm, dd] = value.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd);
};

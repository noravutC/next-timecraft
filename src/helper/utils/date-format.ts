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

export const formatRelativeDay = (d: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / MS_PER_DAY,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

export function formatDateToString(date: string | Date): string {
  const d = date instanceof Date ? date : new Date(date);

  return d.toLocaleDateString("en-US", {
    month: "short", // Aug
    day: "2-digit", // 18
    year: "numeric", // 2025
  });
}
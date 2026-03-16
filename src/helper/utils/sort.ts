// utils/sort.ts

export function sortObjArray<T>(
  data: T[],
  key: keyof T,
  direction: "asc" | "desc",
) {
  const sorted = [...data];
  return sorted.sort((a, b) => {
    const aVal = a[key] as number;
    const bVal = b[key] as number;
    return direction === "asc" ? aVal - bVal : bVal - aVal;
  });
}

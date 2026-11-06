/** แปลง array of ids → record ที่ทุก key มีค่าเดียวกัน เช่น toValueRecord(['a','b'], true) → {a:true, b:true} */
export const toValueRecord = <V>(ids: string[], value: V): Record<string, V> =>
  Object.fromEntries(ids.map((id) => [id, value]));

export const toRecord = <
  T extends object,
  K extends keyof T,
  U = T,
>(
  array: T[],
  key: K,
  transformer?: (item: T) => U,
): Record<string, U> => {
  return array.reduce(
    (acc, item) => {
      // บังคับแปลง value ของ key เป็น string เพื่อใช้เป็น key ของ object
      const recordKey = String(item[key]);

      // ถ้ามี transformer ให้ใช้ ถ้าไม่มีให้ใช้ item เดิม
      acc[recordKey] = transformer ? transformer(item) : (item as unknown as U);

      return acc;
    },
    {} as Record<string, U>,
  );
};

/** Split an array into consecutive pieces of at most `size` items. */
export const chunk = <T>(array: T[], size: number): T[][] => {
  if (size < 1) throw new RangeError("chunk size must be at least 1");
  const pieces: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    pieces.push(array.slice(i, i + size));
  }
  return pieces;
};

/** The same keys, with the values they have in `source` (to undo a change). */
export const pickKeys = <T extends object, K extends keyof T>(
  source: T,
  keys: K[],
): Pick<T, K> =>
  Object.fromEntries(keys.map((key) => [key, source[key]])) as Pick<T, K>;

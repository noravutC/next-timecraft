/** แปลง array of ids → record ที่ทุก key มีค่าเดียวกัน เช่น toValueRecord(['a','b'], true) → {a:true, b:true} */
export const toValueRecord = <V>(ids: string[], value: V): Record<string, V> =>
  Object.fromEntries(ids.map((id) => [id, value]));

export const toRecord = <
  T extends Record<string, any>,
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

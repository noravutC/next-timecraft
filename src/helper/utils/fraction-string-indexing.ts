import { generateNKeysBetween, generateKeyBetween } from "fractional-indexing";

export const isValidFractionKey = (
  value: string | null | undefined,
): value is string => {
  if (!value) return false;
  try {
    generateKeyBetween(value, null);
    return true;
  } catch {
    return false;
  }
};

const sanitize = (key: string | null | undefined): string | null =>
  isValidFractionKey(key) ? key : null;

export const assignBulkIndexes = <
  T extends { orderFraction?: string | null | undefined },
>(
  payloads: T[],
  prevOrder: string | null = null,
  nextOrder: string | null = null,
): T[] => {
  if (payloads.length === 0) return payloads;

  const generatedKeys = generateNKeysBetween(
    sanitize(prevOrder),
    sanitize(nextOrder),
    payloads.length,
  );

  return payloads.map((item, index) => ({
    ...item,
    orderFraction: generatedKeys[index],
  }));
};

export const generateFractionBetween = (
  prevOrder: string | null | undefined,
  nextOrder: string | null | undefined,
) => generateKeyBetween(sanitize(prevOrder), sanitize(nextOrder));

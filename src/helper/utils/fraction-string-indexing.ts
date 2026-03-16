import { generateNKeysBetween, generateKeyBetween } from "fractional-indexing";

export const assignBulkIndexes = <
  T extends { orderFraction?: string | null | undefined },
>(
  payloads: T[],
  prevOrder: string | null = null,
  nextOrder: string | null = null,
): T[] => {
  if (payloads.length === 0) return payloads;

  // Generate an array of fractional index strings
  const generatedKeys = generateNKeysBetween(
    prevOrder,
    nextOrder,
    payloads.length,
  );

  // Map the generated keys back to the payload array
  return payloads.map((item, index) => ({
    ...item,
    orderFraction: generatedKeys[index],
  }));
};

export const generateFractionBetween = (
  prevOrder: string | null | undefined,
  nextOrder: string | null | undefined,
) => generateKeyBetween(prevOrder ?? null, nextOrder ?? null);

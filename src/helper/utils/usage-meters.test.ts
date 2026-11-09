import { describe, expect, it } from 'vitest';
import { isNearLimit, usagePercent } from './usage-meters';

const meter = (used: number, limit: number) =>
  ({ kind: 'ai', used, limit }) as const;

describe('usage meters', () => {
  it('fills to the share used, never past full', () => {
    expect(usagePercent(meter(17, 20))).toBe(85);
    expect(usagePercent(meter(0, 30))).toBe(0);
    expect(usagePercent(meter(25, 20))).toBe(100);
  });

  it('is near the limit from 80% on', () => {
    expect(isNearLimit(meter(15, 20))).toBe(false);
    expect(isNearLimit(meter(16, 20))).toBe(true);
  });
});

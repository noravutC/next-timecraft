import { describe, expect, it } from 'vitest';
import { centerSquare } from './image-file';

describe('centerSquare', () => {
  it('crops the middle of a wide image', () => {
    expect(centerSquare(300, 100)).toEqual({ x: 100, y: 0, side: 100 });
  });

  it('crops the middle of a tall image', () => {
    expect(centerSquare(80, 200)).toEqual({ x: 0, y: 60, side: 80 });
  });

  it('keeps a square image whole', () => {
    expect(centerSquare(64, 64)).toEqual({ x: 0, y: 0, side: 64 });
  });
});

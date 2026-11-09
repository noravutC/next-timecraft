import { describe, expect, it } from 'vitest';
import { deleteColumnMessage, wipLimitLabel } from './column-copy';

describe('column copy', () => {
  it('says what happens to the tasks of a deleted column', () => {
    expect(deleteColumnMessage(0)).toBe('It has no tasks.');
    expect(deleteColumnMessage(1)).toBe('Its 1 task goes with it.');
    expect(deleteColumnMessage(4)).toBe('Its 4 tasks go with it.');
  });

  it('shows an unset WIP limit as Off', () => {
    expect(wipLimitLabel(0)).toBe('Off');
    expect(wipLimitLabel(3)).toBe('3');
  });
});

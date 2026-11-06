import { describe, expect, it } from 'vitest';
import { deleteColumnMessage, wipLimitLabel } from './column-copy';

describe('column copy', () => {
  it('says what happens to the tasks of a deleted column', () => {
    expect(deleteColumnMessage(0)).toBe(
      'It has no tasks. You can restore it from Board settings › Archive.',
    );
    expect(deleteColumnMessage(1)).toMatch(/^Its 1 task goes to the archive/);
    expect(deleteColumnMessage(4)).toBe(
      'Its 4 tasks go to the archive with it. You can restore both from Board settings › Archive.',
    );
  });

  it('shows an unset WIP limit as Off', () => {
    expect(wipLimitLabel(0)).toBe('Off');
    expect(wipLimitLabel(3)).toBe('3');
  });
});

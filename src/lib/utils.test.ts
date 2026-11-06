import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn with the UI kit tokens', () => {
  it('keeps a role font size next to a text color', () => {
    expect(cn('text-ink', 'text-title')).toBe('text-ink text-title');
    expect(cn('text-display text-ink-muted')).toBe(
      'text-display text-ink-muted',
    );
  });

  it('lets a later font size replace an earlier one', () => {
    expect(cn('text-2xl', 'text-title')).toBe('text-title');
    expect(cn('text-heading', 'text-heading-sm')).toBe('text-heading-sm');
  });

  it('replaces kit shadows and radius instead of stacking them', () => {
    expect(cn('shadow-card', 'shadow-none')).toBe('shadow-none');
    expect(cn('rounded-popover', 'rounded-xl')).toBe('rounded-xl');
  });
});

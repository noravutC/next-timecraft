// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './segmented-control';

const OPTIONS = [
  { value: 'board', label: 'Board' },
  { value: 'calendar', label: 'Calendar' },
] as const;

describe('SegmentedControl', () => {
  it('is a named radio group with the picked option checked', () => {
    render(
      <SegmentedControl
        aria-label="View"
        options={[...OPTIONS]}
        value="calendar"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'View' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Calendar' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Board' })).not.toBeChecked();
  });

  it('checks nothing when no value is picked yet', () => {
    render(
      <SegmentedControl
        aria-label="View"
        options={[...OPTIONS]}
        value={null}
        onChange={() => {}}
      />,
    );
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toBeChecked();
    }
  });

  it('reports the option that was clicked', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="View"
        options={[...OPTIONS]}
        value="board"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Calendar' }));
    expect(onChange).toHaveBeenCalledWith('calendar');
  });
});

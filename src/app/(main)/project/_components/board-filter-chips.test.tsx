// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BoardFilterChips } from './board-filter-chips';
import type { BoardFilterBarState } from './use-board-filter-bar';

const filterState = (over: Partial<BoardFilterBarState> = {}) =>
  ({
    draft: '',
    priorities: [],
    due: [],
    tags: [],
    tagColors: {},
    mine: false,
    assigneeIds: [],
    unassigned: false,
    users: {},
    shownCount: 3,
    totalCount: 12,
    setDraft: vi.fn(),
    togglePriority: vi.fn(),
    toggleDue: vi.fn(),
    toggleTag: vi.fn(),
    toggleMine: vi.fn(),
    toggleAssignee: vi.fn(),
    toggleUnassigned: vi.fn(),
    clear: vi.fn(),
    ...over,
  }) as unknown as BoardFilterBarState;

describe('BoardFilterChips', () => {
  it('says how many cards are showing out of the total', () => {
    render(<BoardFilterChips filter={filterState()} />);
    expect(screen.getByText('Showing 3 of 12')).toBeVisible();
  });

  it('leaves the total out while it is unknown', () => {
    render(<BoardFilterChips filter={filterState({ totalCount: null })} />);
    expect(screen.getByText('Showing 3')).toBeVisible();
  });

  it('shows one chip per active filter', () => {
    render(
      <BoardFilterChips
        filter={filterState({
          draft: '  invoice ',
          priorities: ['high'],
          due: ['overdue'],
          tags: ['bug'],
          mine: true,
          assigneeIds: ['u1', 'u2'],
          unassigned: true,
          users: { u1: { fullName: 'Ada Lovelace' } },
        } as unknown as Partial<BoardFilterBarState>)}
      />,
    );
    for (const label of [
      'Search: invoice',
      'Priority: High',
      'Overdue',
      'Label: bug',
      'Assigned to me',
      'Assignee: Ada Lovelace',
      // someone who has since left the board
      'Assignee: Unknown member',
      'No assignee',
    ]) {
      expect(
        screen.getByRole('button', { name: `Remove filter ${label}` }),
      ).toBeVisible();
    }
  });

  it('removes just the filter whose chip was clicked', async () => {
    const filter = filterState({ priorities: ['high'], tags: ['bug'] });
    render(<BoardFilterChips filter={filter} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove filter Label: bug' }),
    );
    expect(filter.toggleTag).toHaveBeenCalledWith('bug');
    expect(filter.togglePriority).not.toHaveBeenCalled();
  });

  it('clears the search box and every filter on Clear all', async () => {
    const filter = filterState({ draft: 'invoice', mine: true });
    render(<BoardFilterChips filter={filter} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(filter.setDraft).toHaveBeenCalledWith('');
    expect(filter.clear).toHaveBeenCalledOnce();
  });
});

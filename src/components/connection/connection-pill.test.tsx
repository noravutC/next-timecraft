// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionPill } from './connection-pill';
import { useConnectionStatus } from './use-connection-status';

vi.mock('./use-connection-status', () => ({ useConnectionStatus: vi.fn() }));

beforeEach(() => vi.mocked(useConnectionStatus).mockReset());

describe('ConnectionPill', () => {
  it('shows nothing while online', () => {
    vi.mocked(useConnectionStatus).mockReturnValue('online');
    const { container } = render(<ConnectionPill />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces being offline and that changes will not save', () => {
    vi.mocked(useConnectionStatus).mockReturnValue('offline');
    render(<ConnectionPill />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Changes won’t save until you’re back',
    );
  });

  it('announces reconnecting', () => {
    vi.mocked(useConnectionStatus).mockReturnValue('reconnecting');
    render(<ConnectionPill />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Reconnecting live updates',
    );
  });
});

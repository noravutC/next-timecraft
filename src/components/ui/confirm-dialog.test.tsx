// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './confirm-dialog';

const renderDialog = (
  props: Partial<Parameters<typeof ConfirmDialog>[0]> = {},
) => {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  const view = render(
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title="Delete board"
      description="This can't be undone."
      primaryLabel="Delete"
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onConfirm, onOpenChange, ...view };
};

describe('ConfirmDialog', () => {
  it('is a dialog named by its title and described by its text', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Delete board' });
    expect(dialog).toHaveAccessibleDescription("This can't be undone.");
  });

  it('confirms on the primary button', async () => {
    const { onConfirm } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('asks to close on Cancel without confirming', async () => {
    const { onConfirm, onOpenChange } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('keeps the primary button off while loading', () => {
    renderDialog({ loading: true });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  describe('with a phrase to type', () => {
    it('stays locked until the phrase matches', async () => {
      const { onConfirm } = renderDialog({ confirmPhrase: 'Website Relaunch' });
      const primary = screen.getByRole('button', { name: 'Delete' });
      const input = screen.getByLabelText(/to confirm/i);
      expect(primary).toBeDisabled();

      await userEvent.type(input, 'Website');
      expect(primary).toBeDisabled();

      await userEvent.type(input, ' Relaunch');
      expect(primary).toBeEnabled();
      await userEvent.click(primary);
      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('ignores spaces around the phrase but not its case', async () => {
      renderDialog({ confirmPhrase: 'Roadmap' });
      const primary = screen.getByRole('button', { name: 'Delete' });
      const input = screen.getByLabelText(/to confirm/i);

      await userEvent.type(input, 'roadmap');
      expect(primary).toBeDisabled();

      await userEvent.clear(input);
      await userEvent.type(input, '  Roadmap ');
      expect(primary).toBeEnabled();
    });

    it('forgets what was typed once it closes', async () => {
      const { rerender, onConfirm, onOpenChange } = renderDialog({
        confirmPhrase: 'Roadmap',
      });
      await userEvent.type(screen.getByLabelText(/to confirm/i), 'Roadmap');

      const props = {
        onOpenChange,
        onConfirm,
        title: 'Delete board',
        primaryLabel: 'Delete',
        confirmPhrase: 'Roadmap',
      };
      rerender(<ConfirmDialog open={false} {...props} />);
      rerender(<ConfirmDialog open {...props} />);

      expect(screen.getByLabelText(/to confirm/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    });
  });
});

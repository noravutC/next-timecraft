import { render } from '@react-email/components';
import { describe, expect, it } from 'vitest';
import { BoardInviteEmail } from './board-invite';

describe('BoardInviteEmail', () => {
  it('names the board and role, links to the invite and to settings', async () => {
    const html = await render(
      BoardInviteEmail({
        inviterName: 'Ploy S.',
        boardName: 'Mobile App v2',
        roleLabel: 'Editor',
        acceptUrl: 'https://timecraft.example/invite/7f3c9a1e',
      }),
    );
    expect(html).toContain('Ploy S. invited you to “Mobile App v2”');
    expect(html).toContain('as Editor to collaborate');
    expect(html).toContain('href="https://timecraft.example/invite/7f3c9a1e"');
    expect(html).toContain('/settings/notifications');
    expect(html).toContain('/email/logo-mark.png');
    expect(html).not.toMatch(/[—–]/);
  });
});

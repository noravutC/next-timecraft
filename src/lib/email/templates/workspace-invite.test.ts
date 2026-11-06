import { render } from '@react-email/components';
import { describe, expect, it } from 'vitest';
import { WorkspaceInviteEmail } from './workspace-invite';

describe('WorkspaceInviteEmail', () => {
  it('names the workspace and role and links to the join page', async () => {
    const html = await render(
      WorkspaceInviteEmail({
        inviterName: 'Ploy S.',
        workspaceName: 'Northwind Studio',
        roleLabel: 'Member',
        roleHint: 'You can open and work on every board in it once you join.',
        acceptUrl: 'https://timecraft.example/join/abc123',
      }),
    );
    expect(html).toContain('Ploy S. invited you to Northwind Studio');
    expect(html).toContain('href="https://timecraft.example/join/abc123"');
    expect(html).toContain('Member');
    expect(html).not.toMatch(/[—–]/);
  });
});

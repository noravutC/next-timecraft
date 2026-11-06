import { describe, expect, it } from 'vitest';
import { boardGuestMeta, workspaceMemberMeta } from './workspace-members';

const board = (name: string, role: 'viewer' | 'editor') => ({
  projectId: name,
  name,
  role,
});

describe('workspace member lines', () => {
  it('counts boards and says when they joined', () => {
    expect(
      workspaceMemberMeta(
        { boardCount: 6, joinedAt: new Date('2026-09-30T10:00:00Z') },
        new Date('2026-11-06T10:00:00Z'),
      ),
    ).toBe('6 boards · joined Sep 30');
    expect(
      workspaceMemberMeta(
        { boardCount: 1, joinedAt: new Date('2026-09-30T10:00:00Z') },
        new Date('2026-11-06T10:00:00Z'),
      ),
    ).toBe('1 board · joined Sep 30');
  });

  it('says where a guest is', () => {
    expect(
      boardGuestMeta({ boards: [board('Website Relaunch', 'viewer')] }),
    ).toBe('Viewer on Website Relaunch');
    expect(
      boardGuestMeta({
        boards: [board('Launch', 'editor'), board('Roadmap', 'viewer')],
      }),
    ).toBe('On Launch and Roadmap');
    expect(
      boardGuestMeta({
        boards: [
          board('A', 'editor'),
          board('B', 'editor'),
          board('C', 'viewer'),
        ],
      }),
    ).toBe('On 3 boards');
  });
});

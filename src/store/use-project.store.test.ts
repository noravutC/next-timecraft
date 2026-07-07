import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Member, ProjectCache } from '@/types';

const { fetchUsersMock } = vi.hoisted(() => ({ fetchUsersMock: vi.fn() }));

vi.mock('@/services/projects.service', () => ({
  projectServices: {
    getProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    inviteMember: vi.fn(),
  },
}));

vi.mock('./use-user.store', () => ({
  useUserStore: { getState: () => ({ fetchUsers: fetchUsersMock }) },
}));

import { useProjectStore } from './use-project.store';
import { projectServices } from '@/services/projects.service';

const makeMember = (userId: string, role: Member['role'] = 'owner'): Member => ({
  userId,
  role,
  joinedAt: new Date('2026-01-01'),
});

const makeProject = (id: string, members: Member[]): ProjectCache =>
  ({
    id,
    name: `board-${id}`,
    members,
    timestamp: 0,
  }) as ProjectCache;

const seedStore = (projects: ProjectCache[]) => {
  useProjectStore.setState({
    projects: Object.fromEntries(projects.map((p) => [p.id, p])),
    projectIsUsing: projects[0]?.id ?? null,
    status: 'none',
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  seedStore([]);
});

describe('inviteMember', () => {
  it('appends the created member and seeds the invited user profile', async () => {
    seedStore([makeProject('p1', [makeMember('u1')])]);
    const created = makeMember('u2', 'editor');
    vi.mocked(projectServices.inviteMember).mockResolvedValue({
      created,
      message: 'ok',
      status: 201,
    });

    await useProjectStore
      .getState()
      .inviteMember('p1', { email: 'u2@example.com', role: 'editor' });

    const members = useProjectStore.getState().projects['p1'].members;
    expect(members).toHaveLength(2);
    expect(members[1]).toMatchObject({ userId: 'u2', role: 'editor' });
    expect(useProjectStore.getState().status).toBe('none');
    expect(fetchUsersMock).toHaveBeenCalledWith(['u2']);
  });

  it('keeps members unchanged and sets error status when the API fails', async () => {
    seedStore([makeProject('p1', [makeMember('u1')])]);
    vi.mocked(projectServices.inviteMember).mockRejectedValue({
      message: 'No TimeCraft account found for this email',
      status: 404,
    });

    await expect(
      useProjectStore
        .getState()
        .inviteMember('p1', { email: 'ghost@example.com', role: 'viewer' }),
    ).rejects.toMatchObject({ status: 404 });

    expect(useProjectStore.getState().projects['p1'].members).toHaveLength(1);
    expect(useProjectStore.getState().status).toBe('error');
    expect(fetchUsersMock).not.toHaveBeenCalled();
  });

  it('is a no-op when the response has no created member', async () => {
    seedStore([makeProject('p1', [makeMember('u1')])]);
    vi.mocked(projectServices.inviteMember).mockResolvedValue({
      created: null,
      message: 'ok',
      status: 201,
    });

    await useProjectStore
      .getState()
      .inviteMember('p1', { email: 'u2@example.com', role: 'editor' });

    expect(useProjectStore.getState().projects['p1'].members).toHaveLength(1);
    expect(useProjectStore.getState().status).toBe('none');
    expect(fetchUsersMock).not.toHaveBeenCalled();
  });
});

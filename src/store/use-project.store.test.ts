import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Member, ProjectCache } from '@/types';

vi.mock('@/services/projects.service', () => ({
  projectServices: {
    getProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    removeMember: vi.fn(),
  },
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

describe('removeMember (pessimistic delete)', () => {
  it('removes only the target member after the API confirms', async () => {
    seedStore([
      makeProject('p1', [makeMember('u1'), makeMember('u2', 'editor')]),
    ]);
    vi.mocked(projectServices.removeMember).mockResolvedValue({
      deleted: makeMember('u2', 'editor'),
      message: 'ok',
      status: 200,
    });

    await useProjectStore.getState().removeMember('p1', 'u2');

    const members = useProjectStore.getState().projects['p1'].members;
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe('u1');
    expect(useProjectStore.getState().status).toBe('none');
    expect(projectServices.removeMember).toHaveBeenCalledWith('p1', 'u2');
  });

  it('keeps members and sets error status when the API fails', async () => {
    seedStore([
      makeProject('p1', [makeMember('u1'), makeMember('u2', 'viewer')]),
    ]);
    vi.mocked(projectServices.removeMember).mockRejectedValue({
      message: 'The board owner cannot be removed',
      status: 400,
    });

    await expect(
      useProjectStore.getState().removeMember('p1', 'u2'),
    ).rejects.toMatchObject({ status: 400 });

    expect(useProjectStore.getState().projects['p1'].members).toHaveLength(2);
    expect(useProjectStore.getState().status).toBe('error');
  });
});

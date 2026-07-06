import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TaskCache } from '@/types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

vi.mock('@/services/tasks.service', () => ({
  taskServices: {
    createTasks: vi.fn(),
    updateTasks: vi.fn(),
    deleteTasks: vi.fn(),
    getTasksByColumns: vi.fn(),
  },
}));

vi.mock('./use-column.store', () => ({
  useColumnStore: { setState: vi.fn(), getState: vi.fn() },
}));

import { useTaskStore } from './use-task.store';
import { taskServices } from '@/services/tasks.service';

const makeTask = (id: string, overrides: Partial<TaskCache> = {}): TaskCache =>
  ({
    id,
    title: `task-${id}`,
    columnId: 'col-1',
    orderFraction: 'a0',
    ...overrides,
  }) as TaskCache;

const seedStore = (tasks: TaskCache[]) => {
  useTaskStore.setState({
    tasks: Object.fromEntries(tasks.map((t) => [t.id, t])),
    tasksLoader: {},
    taskPages: {},
    loadMoreLoader: {},
    status: 'none',
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  seedStore([]);
});

describe('updateTasks (optimistic update)', () => {
  it('applies the payload to local state before the API resolves', async () => {
    seedStore([makeTask('t1')]);
    let resolveApi!: (
      v: Awaited<ReturnType<typeof taskServices.updateTasks>>,
    ) => void;
    vi.mocked(taskServices.updateTasks).mockReturnValue(
      new Promise((r) => (resolveApi = r)),
    );

    const pending = useTaskStore
      .getState()
      .updateTasks(['t1'], [{ columnId: 'col-1', title: 'renamed' }]);

    // optimistic: state already changed while the request is in flight
    expect(useTaskStore.getState().tasks['t1'].title).toBe('renamed');
    expect(useTaskStore.getState().tasksLoader['t1']).toBe(true);

    resolveApi({
      updated: [makeTask('t1', { title: 'renamed' })],
      message: 'ok',
      status: 200,
    });
    await pending;
    expect(useTaskStore.getState().tasksLoader['t1']).toBe(false);
  });

  it('merges the server response into state on success', async () => {
    seedStore([makeTask('t1')]);
    vi.mocked(taskServices.updateTasks).mockResolvedValue({
      updated: [makeTask('t1', { title: 'from-server', orderFraction: 'a5' })],
      message: 'ok',
    } as Awaited<ReturnType<typeof taskServices.updateTasks>>);

    await useTaskStore
      .getState()
      .updateTasks(['t1'], [{ columnId: 'col-1', title: 'renamed' }]);

    const t1 = useTaskStore.getState().tasks['t1'];
    expect(t1.title).toBe('from-server');
    expect(t1.orderFraction).toBe('a5');
  });

  it('reverts to the snapshot when the API call fails', async () => {
    seedStore([makeTask('t1', { title: 'original' })]);
    vi.mocked(taskServices.updateTasks).mockRejectedValue(new Error('boom'));

    await expect(
      useTaskStore
        .getState()
        .updateTasks(['t1'], [{ columnId: 'col-1', title: 'renamed' }]),
    ).rejects.toThrow('boom');

    expect(useTaskStore.getState().tasks['t1'].title).toBe('original');
    expect(useTaskStore.getState().tasksLoader['t1']).toBe(false);
  });

  it('a failed stale request does not clobber a newer optimistic update', async () => {
    seedStore([makeTask('t1', { title: 'original' })]);

    let rejectFirst!: (e: Error) => void;
    vi.mocked(taskServices.updateTasks)
      .mockReturnValueOnce(
        new Promise((_r, rej) => (rejectFirst = rej)) as ReturnType<
          typeof taskServices.updateTasks
        >,
      )
      .mockResolvedValueOnce({
        updated: [makeTask('t1', { title: 'second' })],
        message: 'ok',
      } as Awaited<ReturnType<typeof taskServices.updateTasks>>);

    const first = useTaskStore
      .getState()
      .updateTasks(['t1'], [{ columnId: 'col-1', title: 'first' }]);
    const second = useTaskStore
      .getState()
      .updateTasks(['t1'], [{ columnId: 'col-1', title: 'second' }]);

    rejectFirst(new Error('stale failure'));
    await expect(first).rejects.toThrow('stale failure');
    await second;

    // the older request's rollback must not restore "original"
    expect(useTaskStore.getState().tasks['t1'].title).toBe('second');
  });

  it('returns null without calling the API for empty input', async () => {
    const result = await useTaskStore.getState().updateTasks([], []);
    expect(result).toBeNull();
    expect(taskServices.updateTasks).not.toHaveBeenCalled();
  });
});

describe('deleteTasks', () => {
  it('removes tasks from state after a successful delete', async () => {
    seedStore([makeTask('t1'), makeTask('t2')]);
    vi.mocked(taskServices.deleteTasks).mockResolvedValue({
      deleted: true,
      message: 'ok',
    } as Awaited<ReturnType<typeof taskServices.deleteTasks>>);

    await useTaskStore.getState().deleteTasks(['t1']);

    expect(useTaskStore.getState().tasks['t1']).toBeUndefined();
    expect(useTaskStore.getState().tasks['t2']).toBeDefined();
  });

  it('keeps tasks and sets error status when delete fails', async () => {
    seedStore([makeTask('t1')]);
    vi.mocked(taskServices.deleteTasks).mockRejectedValue(new Error('boom'));

    await expect(useTaskStore.getState().deleteTasks(['t1'])).rejects.toThrow();

    expect(useTaskStore.getState().tasks['t1']).toBeDefined();
    expect(useTaskStore.getState().status).toBe('error');
  });
});

describe('realtime ingest', () => {
  it('updateTaskFromRealtime merges and stamps a timestamp', () => {
    seedStore([makeTask('t1', { title: 'old' })]);

    useTaskStore
      .getState()
      .updateTaskFromRealtime(makeTask('t1', { title: 'live' }));

    const t1 = useTaskStore.getState().tasks['t1'];
    expect(t1.title).toBe('live');
    expect(t1.timestamp).toBeTypeOf('number');
  });

  it('removeTasksFromRealtime drops only the given ids', () => {
    seedStore([makeTask('t1'), makeTask('t2')]);

    useTaskStore.getState().removeTasksFromRealtime(['t2']);

    expect(useTaskStore.getState().tasks).toHaveProperty('t1');
    expect(useTaskStore.getState().tasks).not.toHaveProperty('t2');
  });
});

describe('loadMoreTasks (column pagination)', () => {
  const pageWithMore = () => ({
    hasMore: true,
    nextCursor: { orderFraction: 'a5', id: 't5' },
    total: 45,
  });

  it('fetches the next page with the column cursor and merges results', async () => {
    seedStore([makeTask('t1')]);
    useTaskStore.setState({ taskPages: { 'col-1': pageWithMore() } });
    vi.mocked(taskServices.getTasksByColumns).mockResolvedValue({
      data: [makeTask('t6', { orderFraction: 'a6' })],
      assignees: {},
      pageInfo: { 'col-1': { hasMore: false, nextCursor: null, total: 45 } },
      message: 'ok',
      status: 200,
    });

    await useTaskStore.getState().loadMoreTasks('col-1');

    expect(taskServices.getTasksByColumns).toHaveBeenCalledWith(['col-1'], 20, {
      'col-1': { orderFraction: 'a5', id: 't5' },
    });
    expect(useTaskStore.getState().tasks['t6']).toBeDefined();
    expect(useTaskStore.getState().taskPages['col-1'].hasMore).toBe(false);
    expect(useTaskStore.getState().loadMoreLoader['col-1']).toBe(false);
  });

  it('is a no-op when the column has no more tasks', async () => {
    useTaskStore.setState({
      taskPages: { 'col-1': { hasMore: false, nextCursor: null, total: 3 } },
    });

    await useTaskStore.getState().loadMoreTasks('col-1');

    expect(taskServices.getTasksByColumns).not.toHaveBeenCalled();
  });

  it('is a no-op while a load for the same column is in flight', async () => {
    useTaskStore.setState({
      taskPages: { 'col-1': pageWithMore() },
      loadMoreLoader: { 'col-1': true },
    });

    await useTaskStore.getState().loadMoreTasks('col-1');

    expect(taskServices.getTasksByColumns).not.toHaveBeenCalled();
  });

  it('clears the loader and rethrows when the request fails', async () => {
    useTaskStore.setState({ taskPages: { 'col-1': pageWithMore() } });
    vi.mocked(taskServices.getTasksByColumns).mockRejectedValue(
      new Error('network'),
    );

    await expect(
      useTaskStore.getState().loadMoreTasks('col-1'),
    ).rejects.toThrow();

    expect(useTaskStore.getState().loadMoreLoader['col-1']).toBe(false);
  });
});

describe('realtime ingest with a partially loaded column', () => {
  const seedPartialColumn = () => {
    seedStore([makeTask('t1', { orderFraction: 'a1' })]);
    useTaskStore.setState({
      taskPages: {
        'col-1': {
          hasMore: true,
          nextCursor: { orderFraction: 'a5', id: 't5' },
          total: 45,
        },
      },
    });
  };

  it('skips a new task that lies beyond the loaded window', () => {
    seedPartialColumn();

    useTaskStore
      .getState()
      .updateTaskFromRealtime(makeTask('t9', { orderFraction: 'a9' }));

    expect(useTaskStore.getState().tasks['t9']).toBeUndefined();
  });

  it('still applies updates to already-loaded tasks', () => {
    seedPartialColumn();

    useTaskStore
      .getState()
      .updateTaskFromRealtime(
        makeTask('t1', { title: 'renamed', orderFraction: 'a1' }),
      );

    expect(useTaskStore.getState().tasks['t1'].title).toBe('renamed');
  });

  it('addTasksFromRealtime keeps in-window tasks and drops beyond-window ones', () => {
    seedPartialColumn();

    useTaskStore
      .getState()
      .addTasksFromRealtime([
        makeTask('t2', { orderFraction: 'a2' }),
        makeTask('t9', { orderFraction: 'a9' }),
      ]);

    expect(useTaskStore.getState().tasks['t2']).toBeDefined();
    expect(useTaskStore.getState().tasks['t9']).toBeUndefined();
  });
});

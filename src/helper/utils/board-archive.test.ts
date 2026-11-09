import { describe, expect, it } from 'vitest';
import {
  archivedTaskMeta,
  deletedColumnMeta,
  filterArchive,
} from './board-archive';

const now = new Date('2026-11-06T12:00:00Z');

describe('board archive lines', () => {
  it('says where an archived task came from, and who archived it when', () => {
    expect(
      archivedTaskMeta(
        {
          columnName: 'Review',
          archivedByName: 'Mint Thong',
          archivedAt: new Date('2026-11-02T09:00:00Z'),
        },
        now,
      ),
    ).toBe('From Review · archived by Mint T. on Nov 2');
    expect(
      archivedTaskMeta(
        { columnName: 'Done', archivedByName: null, archivedAt: null },
        now,
      ),
    ).toBe('From Done');
  });

  it('counts a deleted column’s tasks', () => {
    expect(
      deletedColumnMeta(
        {
          taskCount: 2,
          deletedByName: 'Noravut Chai',
          deletedAt: new Date('2026-11-04T09:00:00Z'),
        },
        now,
      ),
    ).toBe('2 tasks · deleted by Noravut C. on Nov 4');
    expect(
      deletedColumnMeta(
        { taskCount: 1, deletedByName: null, deletedAt: null },
        now,
      ),
    ).toBe('1 task');
  });

  it('searches titles and column names', () => {
    const archive = {
      tasks: [{ title: 'Hero illustration' }, { title: 'Weekly notes' }],
      columns: [{ name: 'QA' }],
    } as Parameters<typeof filterArchive>[0];
    const found = filterArchive(archive, 'hero');
    expect(found.tasks).toHaveLength(1);
    expect(found.columns).toHaveLength(0);
  });
});

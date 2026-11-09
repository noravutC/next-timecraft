import { describe, expect, it } from 'vitest';
import { diffTaskActivity, listDiff } from './task-activity';

const TODO = { id: 'c-todo', name: 'To do', color: '#3B82F6' };
const DOING = { id: 'c-doing', name: 'In progress', color: '#F59E0B' };
const columns = new Map([
  [TODO.id, TODO],
  [DOING.id, DOING],
]);

const base = {
  columnId: TODO.id,
  title: 'Migrate sign-in',
  description: 'Old text',
  priority: 'medium' as const,
  dueDate: new Date('2026-11-10T05:00:00Z'),
  tags: ['Auth'],
  estimatedHours: 0,
  archived: false,
};

describe('diffTaskActivity', () => {
  it('records nothing for a reorder inside the column', () => {
    expect(diffTaskActivity(base, { ...base }, columns)).toEqual([]);
  });

  it('records a move with both columns as they are now', () => {
    expect(
      diffTaskActivity(base, { ...base, columnId: DOING.id }, columns),
    ).toEqual([{ type: 'moved', data: { from: TODO, to: DOING } }]);
  });

  it('records each changed field once', () => {
    const after = {
      ...base,
      title: 'Migrate sign-in to Auth.js v5',
      description: 'New text',
      priority: 'high' as const,
      dueDate: new Date('2026-11-12T05:00:00Z'),
      tags: ['Auth', 'Infra'],
      estimatedHours: 8,
    };
    expect(diffTaskActivity(base, after, columns).map((e) => e.type)).toEqual([
      'renamed',
      'description_changed',
      'priority_changed',
      'due_changed',
      'labels_changed',
      'estimate_changed',
    ]);
  });

  it('treats an empty description and none as the same', () => {
    expect(
      diffTaskActivity(
        { ...base, description: null },
        { ...base, description: '' },
        columns,
      ),
    ).toEqual([]);
  });

  it('records clearing the due date', () => {
    expect(diffTaskActivity(base, { ...base, dueDate: null }, columns)).toEqual(
      [
        {
          type: 'due_changed',
          data: { from: '2026-11-10T05:00:00.000Z', to: null },
        },
      ],
    );
  });

  it('records archiving and restoring', () => {
    const archived = { ...base, archived: true };
    expect(diffTaskActivity(base, archived, columns)).toEqual([
      { type: 'archived', data: {} },
    ]);
    expect(diffTaskActivity(archived, base, columns)).toEqual([
      { type: 'restored', data: {} },
    ]);
  });
});

describe('listDiff', () => {
  it('splits added and removed', () => {
    expect(listDiff(['a', 'b'], ['b', 'c'])).toEqual({
      added: ['c'],
      removed: ['a'],
    });
  });
});

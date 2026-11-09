import { describe, expect, it } from 'vitest';
import { boardToCsv, boardToJson, exportFileName } from './board-export';

const data = {
  board: {
    id: 'b',
    name: 'Website Relaunch',
    description: null,
    tags: ['Bug'],
    timeZone: 'Asia/Bangkok',
  },
  columns: [{ id: 'c1', name: 'To do', color: '#3b82f6', wipLimit: 0 }],
  tasks: [
    {
      id: 't1',
      columnId: 'c1',
      title: '=cmd, with "quotes"',
      description: null,
      priority: 'high' as const,
      tags: ['Bug'],
      dueDate: new Date('2026-11-11T17:00:00Z'),
      estimatedHours: 8,
      loggedMinutes: 80,
      archived: false,
      createdAt: new Date('2026-11-01T10:00:00Z'),
      updatedAt: new Date('2026-11-02T10:00:00Z'),
      assignees: ['Ploy S.'],
      subtasks: [
        { title: 'One', completed: true },
        { title: 'Two', completed: false },
      ],
      comments: [
        {
          author: 'Ploy S.',
          body: 'Hi',
          createdAt: new Date('2026-11-03T10:00:00Z'),
          attachments: [],
        },
      ],
    },
  ],
};

describe('board export', () => {
  it('names the file after the board and the day', () => {
    expect(
      exportFileName('Website Relaunch!', 'csv', new Date(2026, 10, 7)),
    ).toBe('website-relaunch-2026-11-07.csv');
    expect(exportFileName('งานไทย', 'json', new Date(2026, 10, 7))).toBe(
      'board-2026-11-07.json',
    );
  });

  it('writes one CSV row per task, safe to open in a spreadsheet', () => {
    const csv = boardToCsv(data);
    const [header, row] = csv.split('\r\n');
    expect(header.startsWith('Title,Column,Priority')).toBe(true);
    expect(
      row.startsWith(
        `"'=cmd, with ""quotes""",To do,high,Bug,2026-11-12,8,80,Ploy S.,1,2,1,no`,
      ),
    ).toBe(true);
  });

  it('writes the whole board as JSON, with columns by name', () => {
    const json = JSON.parse(
      boardToJson(data, new Date('2026-11-07T00:00:00Z')),
    );
    expect(json.board.exportedAt).toBe('2026-11-07T00:00:00.000Z');
    expect(json.tasks[0].column).toBe('To do');
    expect(json.tasks[0].comments[0].body).toBe('Hi');
    expect(json.tasks[0]).not.toHaveProperty('id');
  });
});

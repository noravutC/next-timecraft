import { describe, expect, it } from 'vitest';
import { BOARD_TEMPLATES } from '@/helper/default-project';
import {
  findBoardTemplate,
  templateColumnsPayload,
  templateFlow,
} from './board-templates';
import {
  filterSwitcherActions,
  memberCountLabel,
  orderBoardsForSwitcher,
  splitArchivedBoards,
} from './board-switcher';

describe('board templates', () => {
  it('ships the six templates from the design', () => {
    expect(BOARD_TEMPLATES.map((t) => t.name)).toEqual([
      'Kanban Board',
      'Scrum Sprint',
      'Bug Tracking',
      'Product Roadmap',
      'Content Calendar',
      'Blank Board',
    ]);
  });

  it('finds by id and falls back to the first template', () => {
    expect(findBoardTemplate('roadmap').name).toBe('Product Roadmap');
    expect(findBoardTemplate('nope').id).toBe('kanban');
  });

  it('describes the column flow', () => {
    expect(templateFlow(findBoardTemplate('blank'))).toBe(
      'To Do → Doing → Done',
    );
  });

  it('builds column payloads for the new board in order', () => {
    const payload = templateColumnsPayload(findBoardTemplate('blank'), 'p1');
    expect(payload).toEqual([
      { name: 'To Do', color: '#94A3B8', projectId: 'p1', orderFraction: '' },
      { name: 'Doing', color: '#FBBF24', projectId: 'p1', orderFraction: '' },
      { name: 'Done', color: '#34D399', projectId: 'p1', orderFraction: '' },
    ]);
  });
});

describe('board switcher', () => {
  const boards = [
    { id: 'a', name: 'Mobile App v2' },
    { id: 'b', name: 'Website Relaunch' },
    { id: 'c', name: 'Q4 Marketing' },
  ];

  it('puts the current board first and keeps the rest in order', () => {
    expect(orderBoardsForSwitcher(boards, 'b', '').map((b) => b.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('filters by name, ignoring case and spaces around the query', () => {
    expect(
      orderBoardsForSwitcher(boards, 'b', '  APP ').map((b) => b.id),
    ).toEqual(['a']);
  });

  it('labels member counts', () => {
    expect(memberCountLabel(1)).toBe('1 member');
    expect(memberCountLabel(4)).toBe('4 members');
  });

  it('filters palette actions, falling back to all of them', () => {
    const actions = [
      { label: 'Create new board' },
      { label: 'Board settings' },
    ];
    expect(filterSwitcherActions(actions, 'sett')).toEqual([actions[1]]);
    expect(filterSwitcherActions(actions, 'zzz')).toEqual(actions);
    expect(filterSwitcherActions(actions, '')).toEqual(actions);
  });
});

describe('splitArchivedBoards', () => {
  it('keeps archived boards out of the main list, order intact', () => {
    const boards = [
      { id: 'a', archived: false },
      { id: 'b', archived: true },
      { id: 'c', archived: null },
      { id: 'd', archived: true },
    ];
    const { active, archived } = splitArchivedBoards(boards);
    expect(active.map((b) => b.id)).toEqual(['a', 'c']);
    expect(archived.map((b) => b.id)).toEqual(['b', 'd']);
  });
});

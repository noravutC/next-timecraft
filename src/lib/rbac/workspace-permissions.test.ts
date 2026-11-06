import { describe, expect, it } from 'vitest';
import { canCreateBoards } from './workspace-permissions';

describe('canCreateBoards', () => {
  it('lets owners and admins create boards', () => {
    expect(canCreateBoards('owner')).toBe(true);
    expect(canCreateBoards('admin')).toBe(true);
  });

  it('refuses everyone else, and people with no workspace', () => {
    expect(canCreateBoards('member')).toBe(false);
    expect(canCreateBoards('guest')).toBe(false);
    expect(canCreateBoards(null)).toBe(false);
    expect(canCreateBoards(undefined)).toBe(false);
  });
});

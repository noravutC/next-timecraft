import { describe, expect, it } from 'vitest';
import {
  boardRoleForWorkspaceRole,
  canCreateBoards,
  canInviteToWorkspace,
} from './workspace-permissions';

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

describe('canInviteToWorkspace', () => {
  it('lets owners and admins invite, nobody else', () => {
    expect(canInviteToWorkspace('owner')).toBe(true);
    expect(canInviteToWorkspace('admin')).toBe(true);
    expect(canInviteToWorkspace('member')).toBe(false);
    expect(canInviteToWorkspace(null)).toBe(false);
  });
});

describe('boardRoleForWorkspaceRole', () => {
  it('gives members editing and admins management on every board', () => {
    expect(boardRoleForWorkspaceRole('member')).toBe('editor');
    expect(boardRoleForWorkspaceRole('admin')).toBe('admin');
    expect(boardRoleForWorkspaceRole('owner')).toBe('admin');
  });
});

import { describe, it, expect } from 'vitest';
import { can, canAll, canAny } from './can';
import { ROLE_PERMISSIONS, type ProjectRole } from './permissions';

describe('can', () => {
  it('owner can do everything admin can, plus delete/transfer project', () => {
    expect(can('owner', 'project:delete')).toBe(true);
    expect(can('owner', 'project:transfer_ownership')).toBe(true);
    expect(can('admin', 'project:delete')).toBe(false);
    expect(can('admin', 'project:transfer_ownership')).toBe(false);
  });

  it('editor can work with tasks but not manage project/members', () => {
    expect(can('editor', 'task:create')).toBe(true);
    expect(can('editor', 'task:move')).toBe(true);
    expect(can('editor', 'project:update')).toBe(false);
    expect(can('editor', 'member:invite')).toBe(false);
    expect(can('editor', 'column:create')).toBe(false);
  });

  it('viewer can only view and react', () => {
    expect(can('viewer', 'project:view')).toBe(true);
    expect(can('viewer', 'comment:react')).toBe(true);
    expect(can('viewer', 'task:create')).toBe(false);
    expect(can('viewer', 'task:update')).toBe(false);
    expect(can('viewer', 'comment:upload')).toBe(false);
  });

  it('every role can at least view the project', () => {
    for (const role of Object.keys(ROLE_PERMISSIONS) as ProjectRole[]) {
      expect(can(role, 'project:view')).toBe(true);
    }
  });

  it('role capabilities are strictly nested: viewer ⊆ editor ⊆ admin ⊆ owner', () => {
    const chain: ProjectRole[] = ['viewer', 'editor', 'admin', 'owner'];
    for (let i = 0; i < chain.length - 1; i++) {
      const lower = ROLE_PERMISSIONS[chain[i]];
      const higher = ROLE_PERMISSIONS[chain[i + 1]];
      for (const p of lower) {
        expect(higher.has(p), `${chain[i + 1]} should include ${p}`).toBe(true);
      }
    }
  });
});

describe('canAll / canAny (multi-permission)', () => {
  it('canAll requires EVERY permission — adding one can only tighten access', () => {
    // viewer has project:view but not task:create → the combo must be denied
    expect(canAll('viewer', ['project:view'])).toBe(true);
    expect(canAll('viewer', ['project:view', 'task:create'])).toBe(false);
    expect(canAll('editor', ['project:view', 'task:create'])).toBe(true);
  });

  it('holding only the second permission never unlocks a canAll check', () => {
    // the "board 2" escalation case: editor lacks member:invite, so a check
    // that requires [member:invite, task:create] stays closed even though
    // the editor holds task:create
    expect(can('editor', 'task:create')).toBe(true);
    expect(canAll('editor', ['member:invite', 'task:create'])).toBe(false);
  });

  it('canAny passes with at least one permission — opt-in OR semantics', () => {
    expect(canAny('viewer', ['task:create', 'project:view'])).toBe(true);
    expect(canAny('viewer', ['task:create', 'member:invite'])).toBe(false);
  });

  it('empty permission lists fail closed for canAny', () => {
    expect(canAny('owner', [])).toBe(false);
  });
});

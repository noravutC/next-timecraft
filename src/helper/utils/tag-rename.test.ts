import { describe, expect, it } from 'vitest';
import { dropTagRename, recordTagRename, renameTagsIn } from './tag-rename';

describe('renameTagsIn', () => {
  it('renames in place and keeps the rest', () => {
    expect(renameTagsIn(['Bug', 'Auth'], { Auth: 'Login' })).toEqual([
      'Bug',
      'Login',
    ]);
  });

  it('applies renames all at once, so two tags can swap names', () => {
    expect(renameTagsIn(['A', 'B'], { A: 'B', B: 'A' })).toEqual(['B', 'A']);
  });

  it('drops a duplicate when a task already has the new name', () => {
    expect(renameTagsIn(['Login', 'Auth'], { Auth: 'Login' })).toEqual([
      'Login',
    ]);
  });

  it('ignores names that live on Object.prototype', () => {
    expect(renameTagsIn(['constructor'], {})).toEqual(['constructor']);
  });
});

describe('recordTagRename', () => {
  const saved = ['A', 'B'];

  it('notes a saved tag under its saved name, through later renames', () => {
    const once = recordTagRename({}, saved, 'A', 'X');
    expect(once).toEqual({ A: 'X' });
    expect(recordTagRename(once, saved, 'X', 'Y')).toEqual({ A: 'Y' });
  });

  it('forgets the rename when the tag gets its saved name back', () => {
    expect(recordTagRename({ A: 'X' }, saved, 'X', 'A')).toEqual({});
  });

  it('skips tags added since the last save', () => {
    expect(recordTagRename({}, saved, 'New', 'Newer')).toEqual({});
    // "A" was renamed away and a new "A" added: the new one has no tasks
    expect(recordTagRename({ A: 'X' }, saved, 'A', 'Z')).toEqual({ A: 'X' });
  });

  it('records a swap made in three steps', () => {
    let r = recordTagRename({}, saved, 'A', 'X');
    r = recordTagRename(r, saved, 'B', 'A');
    r = recordTagRename(r, saved, 'X', 'B');
    expect(r).toEqual({ A: 'B', B: 'A' });
  });
});

describe('dropTagRename', () => {
  it('forgets the rename of a removed tag', () => {
    expect(dropTagRename({ A: 'X', B: 'Y' }, 'X')).toEqual({ B: 'Y' });
    expect(dropTagRename({ A: 'X' }, 'B')).toEqual({ A: 'X' });
  });
});

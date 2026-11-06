import { describe, expect, it } from 'vitest';
import { parsePrivateChannel, privateChannel } from './realtime-channel';

const ID = '0b8a4c1e-1f2d-4c3b-9a8e-7d6c5b4a3f21';

describe('realtime channels', () => {
  it('round-trips logical names', () => {
    expect(privateChannel(`project-${ID}`)).toBe(`private-project-${ID}`);
    expect(parsePrivateChannel(privateChannel(`task-${ID}`))).toEqual({
      kind: 'task',
      id: ID,
    });
    expect(parsePrivateChannel(`private-user-${ID}`)).toEqual({
      kind: 'user',
      id: ID,
    });
  });

  it('rejects public, presence, unknown or malformed channels', () => {
    expect(parsePrivateChannel(`project-${ID}`)).toBeNull();
    expect(parsePrivateChannel(`presence-project-${ID}`)).toBeNull();
    expect(parsePrivateChannel(`private-org-${ID}`)).toBeNull();
    expect(parsePrivateChannel(`private-project-${ID}-x`)).toBeNull();
    expect(parsePrivateChannel('private-project-')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { toRouteKey } from './route-key';

const A = '0b8a4c1e-1f2d-4c3b-9a8e-7d6c5b4a3f21';
const B = '6f1e2d3c-4b5a-4968-8776-a5b4c3d2e1f0';

describe('toRouteKey', () => {
  it('collapses single and comma-separated uuids', () => {
    expect(toRouteKey(`/api/task/${A}`)).toBe('api/task/:id');
    expect(toRouteKey(`/api/task/${A},${B}/comments`)).toBe(
      'api/task/:id/comments',
    );
  });

  it('masks long tokens and keeps static segments', () => {
    expect(toRouteKey(`/api/invite/${'ab12'.repeat(16)}`)).toBe(
      'api/invite/:id',
    );
    expect(toRouteKey('/api/ai/task-breakdown')).toBe('api/ai/task-breakdown');
  });

  it('cannot be dodged with encoding, case or slashes', () => {
    expect(toRouteKey('/api/ai/task%2Dbreakdown/')).toBe(
      'api/ai/task-breakdown',
    );
    expect(toRouteKey('//API/AI/Task-Breakdown')).toBe('api/ai/task-breakdown');
  });
});

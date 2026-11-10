import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetRateLimits } from '@/lib/api/rate-limit';
import { recordWebVital } from '@/lib/telemetry/metrics';
import { POST } from './route';

vi.mock('@/lib/telemetry/metrics', async (original) => ({
  ...(await original<typeof import('@/lib/telemetry/metrics')>()),
  recordWebVital: vi.fn(),
}));

const report = (body: unknown, ip = '203.0.113.7') =>
  POST(
    new Request('http://localhost/api/vitals', {
      method: 'POST',
      headers: { 'x-forwarded-for': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

const LCP = { name: 'LCP', value: 1200, rating: 'good', path: '/project' };

beforeEach(() => {
  resetRateLimits();
  vi.mocked(recordWebVital).mockClear();
});

describe('POST /api/vitals', () => {
  it('records a valid metric', async () => {
    expect((await report(LCP)).status).toBe(204);
    expect(recordWebVital).toHaveBeenCalledWith(
      'LCP',
      1200,
      '/project',
      'good',
    );
  });

  it('collapses ids and tokens in the page path', async () => {
    await report({ ...LCP, path: '/invite/AbCdEfGhIjKlMnOpQrStUvWxYz012345' });
    expect(recordWebVital).toHaveBeenCalledWith(
      'LCP',
      1200,
      '/invite/:id',
      'good',
    );
  });

  it.each([
    ['an unknown metric', { ...LCP, name: 'FID' }],
    ['a negative value', { ...LCP, value: -1 }],
    ['a non-numeric value', { ...LCP, value: '1200' }],
    ['an unknown rating', { ...LCP, rating: 'great' }],
    ['a body that is not JSON', 'not json'],
  ])('rejects %s', async (_label, body) => {
    expect((await report(body)).status).toBe(400);
    expect(recordWebVital).not.toHaveBeenCalled();
  });

  it('limits one IP without affecting another', async () => {
    for (let i = 0; i < 60; i++) await report(LCP);
    expect((await report(LCP)).status).toBe(429);
    expect((await report(LCP, '203.0.113.8')).status).toBe(204);
  });
});

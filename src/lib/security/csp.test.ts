import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, createNonce } from './csp';

describe('buildContentSecurityPolicy', () => {
  it('allows scripts only with the nonce, never inline', () => {
    const csp = buildContentSecurityPolicy('abc123', false);
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src'));
    expect(scriptSrc).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('adds eval and the HMR socket only in development', () => {
    const csp = buildContentSecurityPolicy('n', true);
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('ws://localhost:*');
  });

  it('keeps the third parties the app needs', () => {
    const csp = buildContentSecurityPolicy('n', false);
    expect(csp).toContain('wss://*.pusher.com');
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

describe('createNonce', () => {
  it('is fresh every time', () => {
    expect(createNonce()).not.toBe(createNonce());
    expect(createNonce()).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});

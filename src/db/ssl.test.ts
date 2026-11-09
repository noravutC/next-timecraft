import { describe, expect, it } from 'vitest';
import { isLocalDatabase, sslFor, withSslMode } from './ssl';

const REMOTE =
  'postgresql://postgres.abc:pw@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

describe('database TLS', () => {
  it('encrypts remote databases and leaves local ones alone', () => {
    expect(sslFor(REMOTE)).toBe('require');
    expect(sslFor('postgres://ci:ci@localhost:5432/ci')).toBe(false);
    expect(isLocalDatabase('postgres://u:p@db:5432/timecraft')).toBe(true);
  });

  it('adds sslmode for URL-only tools without duplicating it', () => {
    expect(withSslMode(REMOTE)).toBe(`${REMOTE}?sslmode=require`);
    expect(withSslMode(`${REMOTE}?pgbouncer=true`)).toBe(
      `${REMOTE}?pgbouncer=true&sslmode=require`,
    );
    expect(withSslMode(`${REMOTE}?sslmode=verify-full`)).toBe(
      `${REMOTE}?sslmode=verify-full`,
    );
    expect(withSslMode('postgres://u:p@127.0.0.1:54329/x')).toBe(
      'postgres://u:p@127.0.0.1:54329/x',
    );
  });

  it('treats an unparsable URL as remote', () => {
    expect(sslFor('not a url')).toBe('require');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Column, Param, type SQL } from 'drizzle-orm';

// Each db.select() chain resolves to the next queued result, in call order:
// [user row], [owned membership], [first membership].
const queue: unknown[][] = [];
const whereArgs: unknown[] = [];

vi.mock('@/db', () => {
  const chain = () => {
    const c: Record<string, unknown> = {};
    c.from = () => c;
    c.where = (arg: unknown) => {
      whereArgs.push(arg);
      return c;
    };
    c.orderBy = () => c;
    c.limit = () => Promise.resolve(queue.shift() ?? []);
    return c;
  };
  return { db: { select: () => chain(), insert: vi.fn() } };
});

vi.mock('next-auth', () => ({
  default: () => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock('next-auth/providers/google', () => ({
  default: () => ({ id: 'google' }),
}));
vi.mock('next-auth/providers/credentials', () => ({
  default: () => ({ id: 'guest' }),
}));

const { authConfig } = await import('./auth');
const callbacks = authConfig.callbacks as Required<
  NonNullable<typeof authConfig.callbacks>
>;
type JwtParams = Parameters<typeof callbacks.jwt>[0];
type SignInParams = Parameters<typeof callbacks.signIn>[0];
const jwt = (params: Partial<JwtParams>) => callbacks.jwt(params as JwtParams);

// "column=value" of the first where() — i.e. which user the DB was asked for.
const firstLookup = () => {
  const chunks = (whereArgs[0] as SQL).queryChunks;
  const column = chunks.find((c) => c instanceof Column) as Column;
  const param = chunks.find((c) => c instanceof Param) as Param;
  return `${column.name}=${param.value}`;
};

const ATTACKER = { id: 'attacker-id', email: 'guest@timecraft.demo' };

const dbUser = (u: { id: string; email: string }) => ({
  ...u,
  fullName: 'Name',
  avatar: null,
  provider: 'guest',
  providerId: 'guest',
});

const attackerToken = () => ({
  id: ATTACKER.id,
  email: ATTACKER.email,
  systemRole: 'owner' as const,
  canCreateOrg: false,
  hasBoards: true,
  orgRole: 'owner' as const,
  organizationId: 'attacker-org',
});

describe('jwt callback', () => {
  beforeEach(() => {
    queue.length = 0;
    whereArgs.length = 0;
  });

  it('ignores a client update() payload that tries to switch identity', async () => {
    queue.push(
      [dbUser(ATTACKER)],
      [{ id: 'm', organizationId: 'attacker-org' }],
      [],
    );

    const token = await jwt({
      token: attackerToken(),
      trigger: 'update',
      session: {
        user: {
          email: 'victim@gmail.com',
          systemRole: '',
          organizationId: 'victim-org',
        },
      },
    });

    expect(firstLookup()).toBe(`id=${ATTACKER.id}`);
    expect(token).toMatchObject({
      id: ATTACKER.id,
      email: ATTACKER.email,
      organizationId: 'attacker-org',
      systemRole: 'owner',
    });
  });

  it('re-reads org/role from the DB on update() (org creation flow)', async () => {
    queue.push(
      [dbUser(ATTACKER)],
      [{ id: 'm', organizationId: 'new-org' }],
      [],
    );

    const token = await jwt({
      token: {
        ...attackerToken(),
        canCreateOrg: true,
        systemRole: 'user',
        organizationId: undefined,
      },
      trigger: 'update',
      session: {},
    });

    expect(token).toMatchObject({
      organizationId: 'new-org',
      systemRole: 'owner',
      canCreateOrg: false,
    });
  });

  it('does not hit the DB when the token is already complete', async () => {
    const token = await jwt({ token: attackerToken() });
    expect(token).toMatchObject(attackerToken());
    expect(whereArgs).toHaveLength(0);
  });

  it('leaves a token without id or sign-in user untouched (no email fallback)', async () => {
    const token = await jwt({ token: { email: 'victim@gmail.com' } });
    expect(token).toEqual({ email: 'victim@gmail.com' });
    expect(whereArgs).toHaveLength(0);
  });
});

describe('signIn callback', () => {
  it('rejects Google accounts with an unverified email', async () => {
    const ok = await callbacks.signIn({
      user: { email: 'x@example.com' },
      account: { provider: 'google', type: 'oidc', providerAccountId: '1' },
      profile: { email_verified: false },
    } as SignInParams);
    expect(ok).toBe(false);
  });
});

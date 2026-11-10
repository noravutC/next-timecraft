import { trace } from '@opentelemetry/api';
import * as Sentry from '@sentry/nextjs';
import { auth } from '@/auth';
import { toRouteKey } from '@/helper/utils/route-key';
import { isGuestSession } from '@/lib/guest';
import { logger } from '@/lib/logger';
import { authorizeOrThrow, type AuthorizeMode } from '@/lib/rbac/authorize';
import { Permission } from '@/lib/rbac/permissions';
import { recordApiRequest } from '@/lib/telemetry/metrics';
import { Session } from 'next-auth';
import { DrizzleQueryError } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { ZodType } from 'zod';
import { clientIp } from './client-ip';
import { checkRateLimit, peekRateLimit, RateLimitConfig } from './rate-limit';
import {
  AppError,
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError,
} from './errors';

type Awaitable<T> = T | Promise<T>;

export type HandleContext<TBody> = {
  request: Request;
  session: Session;
  userId: string;
  body: TBody;
};

export type ParamHandleContext<TBody, TParams> = HandleContext<TBody> & {
  params: TParams;
};

type ResolveProjectIds<TBody, TParams = undefined> = (input: {
  body: TBody;
  params: TParams;
  userId: string;
}) => Awaitable<string[]>;

type BaseConfig<TBody, TParams = undefined> = {
  body?: ZodType<TBody>;
  /** one permission or several — several requires ALL unless permissionMode: "any" */
  permission?: Permission | Permission[];
  permissionMode?: AuthorizeMode;
  resolveProjectIds?: ResolveProjectIds<TBody, TParams>;
  /** per-user, per-path. Defaults to 120 req/min; tighten for expensive routes */
  rateLimit?: RateLimitConfig;
};

const DEFAULT_RATE_LIMIT: RateLimitConfig = { limit: 120, windowMs: 60_000 };

// All guests share one user id, so they are told apart by IP instead —
// otherwise one guest could exhaust the limit for every other visitor.
const rateLimitIdentity = (request: Request, session: Session) =>
  isGuestSession(session) ? `guest:${clientIp(request)}` : session.user.id;

const consume = (key: string, config: RateLimitConfig, message?: string) => {
  const result = checkRateLimit(key, config);
  if (!result.ok) throw new TooManyRequestsError(result.retryAfterSec, message);
};

// Keyed by route pattern (ids collapsed), so new ids don't mint new buckets.
const enforceRateLimit = (
  request: Request,
  session: Session,
  config: RateLimitConfig | undefined,
) =>
  consume(
    `${rateLimitIdentity(request, session)}:${toRouteKey(new URL(request.url).pathname)}`,
    config ?? DEFAULT_RATE_LIMIT,
  );

/** How much of a named budget the caller has used, for showing it. */
export const quotaUsed = (
  ctx: { request: Request; session: Session },
  name: string,
  config: RateLimitConfig,
) =>
  peekRateLimit(
    `${rateLimitIdentity(ctx.request, ctx.session)}:quota:${name}`,
    config,
  );

/**
 * Extra named budget inside a handler (e.g. a daily cap on one action).
 * Throws 429 when spent. Same identity rules as the per-route limit.
 */
export const enforceQuota = (
  ctx: { request: Request; session: Session },
  name: string,
  config: RateLimitConfig,
  message?: string,
) =>
  consume(
    `${rateLimitIdentity(ctx.request, ctx.session)}:quota:${name}`,
    config,
    message,
  );

const errorResponse = (statusCode: number, message: string) =>
  NextResponse.json({ message, status: statusCode }, { status: statusCode });

const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof SyntaxError)
    return new BadRequestError('Invalid JSON body');
  // DrizzleQueryError's message embeds every bound param (titles, emails…);
  // log the SQL shape and the driver error only.
  const reported =
    error instanceof DrizzleQueryError
      ? Object.assign(
          new Error(error.cause?.message ?? 'Database query failed'),
          {
            query: error.query,
            code: (error.cause as { code?: string } | undefined)?.code,
          },
        )
      : error;
  logger.error({ err: reported }, 'unhandled api error');
  Sentry.captureException(reported);
  return new AppError(500, 'Internal server error');
};

const logRequest = (
  request: Request,
  status: number,
  startedAt: number,
  userId?: string,
) => {
  // ids/tokens collapsed: invite tokens must not land in logs
  const path = toRouteKey(new URL(request.url).pathname);
  const durationMs = Date.now() - startedAt;
  logger.info(
    { method: request.method, path, status, durationMs, userId },
    'api request',
  );
  if (userId) trace.getActiveSpan()?.setAttribute('user.id', userId);
  recordApiRequest(request.method, path, status, durationMs);
};

const parseBody = async <TBody>(
  request: Request,
  schema: ZodType<TBody> | undefined,
): Promise<TBody> => {
  if (!schema) return undefined as TBody;
  const json = await request.json().catch(() => {
    throw new BadRequestError('Invalid JSON body');
  });
  const result = schema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join('.');
    throw new BadRequestError(
      path
        ? `${path}: ${first.message}`
        : (first?.message ?? 'Validation failed'),
    );
  }
  return result.data;
};

const requireSession = async (): Promise<
  Session & { user: { id: string } }
> => {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session as Session & { user: { id: string } };
};

export function createHandle<TBody = undefined>(
  config: BaseConfig<TBody>,
  handler: (ctx: HandleContext<TBody>) => Awaitable<Response>,
) {
  return async (request: Request): Promise<Response> => {
    const startedAt = Date.now();
    let userId: string | undefined;
    try {
      const session = await requireSession();
      userId = session.user.id;
      enforceRateLimit(request, session, config.rateLimit);
      const body = await parseBody(request, config.body);

      if (config.permission) {
        const projectIds = config.resolveProjectIds
          ? await config.resolveProjectIds({ body, params: undefined, userId })
          : [];
        await authorizeOrThrow(userId, projectIds, config.permission, {
          mode: config.permissionMode,
        });
      }

      const response = await handler({ request, session, userId, body });
      logRequest(request, response.status, startedAt, userId);
      return response;
    } catch (error) {
      const err = toAppError(error);
      logRequest(request, err.statusCode, startedAt, userId);
      return errorResponse(err.statusCode, err.message);
    }
  };
}

export function createParamHandle<TParams, TBody = undefined>(
  config: BaseConfig<TBody, TParams>,
  handler: (ctx: ParamHandleContext<TBody, TParams>) => Awaitable<Response>,
) {
  return async (
    request: Request,
    context: { params: Promise<TParams> },
  ): Promise<Response> => {
    const startedAt = Date.now();
    let userId: string | undefined;
    try {
      const session = await requireSession();
      userId = session.user.id;
      enforceRateLimit(request, session, config.rateLimit);
      const params = await context.params;
      const body = await parseBody(request, config.body);

      if (config.permission) {
        const projectIds = config.resolveProjectIds
          ? await config.resolveProjectIds({ body, params, userId })
          : [];
        await authorizeOrThrow(userId, projectIds, config.permission, {
          mode: config.permissionMode,
        });
      }

      const response = await handler({
        request,
        session,
        userId,
        body,
        params,
      });
      logRequest(request, response.status, startedAt, userId);
      return response;
    } catch (error) {
      const err = toAppError(error);
      logRequest(request, err.statusCode, startedAt, userId);
      return errorResponse(err.statusCode, err.message);
    }
  };
}

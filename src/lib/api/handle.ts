import * as Sentry from "@sentry/nextjs";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { Permission } from "@/lib/rbac/permissions";
import { Session } from "next-auth";
import { NextResponse } from "next/server";
import { ZodType } from "zod";
import { checkRateLimit, RateLimitConfig } from "./rate-limit";
import {
  AppError,
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError,
} from "./errors";

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
  permission?: Permission;
  resolveProjectIds?: ResolveProjectIds<TBody, TParams>;
  /** per-user, per-path. Defaults to 120 req/min; tighten for expensive routes */
  rateLimit?: RateLimitConfig;
};

const DEFAULT_RATE_LIMIT: RateLimitConfig = { limit: 120, windowMs: 60_000 };

const enforceRateLimit = (
  request: Request,
  userId: string,
  config: RateLimitConfig | undefined,
) => {
  const { pathname } = new URL(request.url);
  const result = checkRateLimit(
    `${userId}:${pathname}`,
    config ?? DEFAULT_RATE_LIMIT,
  );
  if (!result.ok) throw new TooManyRequestsError(result.retryAfterSec);
};

const errorResponse = (statusCode: number, message: string) =>
  NextResponse.json({ message, status: statusCode }, { status: statusCode });

const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof SyntaxError) return new BadRequestError("Invalid JSON body");
  logger.error({ err: error }, "unhandled api error");
  Sentry.captureException(error);
  return new AppError(500, "Internal server error");
};

const logRequest = (
  request: Request,
  status: number,
  startedAt: number,
  userId?: string,
) => {
  const { pathname } = new URL(request.url);
  logger.info(
    {
      method: request.method,
      path: pathname,
      status,
      durationMs: Date.now() - startedAt,
      userId,
    },
    "api request",
  );
};

const parseBody = async <TBody>(
  request: Request,
  schema: ZodType<TBody> | undefined,
): Promise<TBody> => {
  if (!schema) return undefined as TBody;
  const json = await request.json().catch(() => {
    throw new BadRequestError("Invalid JSON body");
  });
  const result = schema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(".");
    throw new BadRequestError(
      path ? `${path}: ${first.message}` : first?.message ?? "Validation failed",
    );
  }
  return result.data;
};

const requireSession = async (): Promise<Session & { user: { id: string } }> => {
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
      enforceRateLimit(request, userId, config.rateLimit);
      const body = await parseBody(request, config.body);

      if (config.permission) {
        const projectIds = config.resolveProjectIds
          ? await config.resolveProjectIds({ body, params: undefined, userId })
          : [];
        await authorizeOrThrow(userId, projectIds, config.permission);
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
      enforceRateLimit(request, userId, config.rateLimit);
      const params = await context.params;
      const body = await parseBody(request, config.body);

      if (config.permission) {
        const projectIds = config.resolveProjectIds
          ? await config.resolveProjectIds({ body, params, userId })
          : [];
        await authorizeOrThrow(userId, projectIds, config.permission);
      }

      const response = await handler({ request, session, userId, body, params });
      logRequest(request, response.status, startedAt, userId);
      return response;
    } catch (error) {
      const err = toAppError(error);
      logRequest(request, err.statusCode, startedAt, userId);
      return errorResponse(err.statusCode, err.message);
    }
  };
}

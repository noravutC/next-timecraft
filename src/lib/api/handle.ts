import { authOptions } from "@/auth";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { Permission } from "@/lib/rbac/permissions";
import { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { ZodType } from "zod";
import { AppError, BadRequestError, UnauthorizedError } from "./errors";

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
};

const errorResponse = (statusCode: number, message: string) =>
  NextResponse.json({ message, status: statusCode }, { status: statusCode });

const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof SyntaxError) return new BadRequestError("Invalid JSON body");
  console.error("[api]", error);
  return new AppError(500, "Internal server error");
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError();
  return session as Session & { user: { id: string } };
};

export function createHandle<TBody = undefined>(
  config: BaseConfig<TBody>,
  handler: (ctx: HandleContext<TBody>) => Awaitable<Response>,
) {
  return async (request: Request): Promise<Response> => {
    try {
      const session = await requireSession();
      const userId = session.user.id;
      const body = await parseBody(request, config.body);

      if (config.permission) {
        const projectIds = config.resolveProjectIds
          ? await config.resolveProjectIds({ body, params: undefined, userId })
          : [];
        await authorizeOrThrow(userId, projectIds, config.permission);
      }

      return await handler({ request, session, userId, body });
    } catch (error) {
      const err = toAppError(error);
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
    try {
      const session = await requireSession();
      const userId = session.user.id;
      const params = await context.params;
      const body = await parseBody(request, config.body);

      if (config.permission) {
        const projectIds = config.resolveProjectIds
          ? await config.resolveProjectIds({ body, params, userId })
          : [];
        await authorizeOrThrow(userId, projectIds, config.permission);
      }

      return await handler({ request, session, userId, body, params });
    } catch (error) {
      const err = toAppError(error);
      return errorResponse(err.statusCode, err.message);
    }
  };
}

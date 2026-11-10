# syntax=docker/dockerfile:1

# ---- deps: install node_modules with pnpm ----
FROM node:26-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- build: compile Next.js (standalone output) ----
FROM node:26-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time —
# they must be passed as build args, not runtime env.
ARG NEXT_PUBLIC_PUSHER_KEY
ARG NEXT_PUBLIC_PUSHER_CLUSTER
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_PUSHER_KEY=$NEXT_PUBLIC_PUSHER_KEY \
    NEXT_PUBLIC_PUSHER_CLUSTER=$NEXT_PUBLIC_PUSHER_CLUSTER \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

# Where next.config.ts uploads source maps, when the build is also given
# the sentry_auth_token secret below. All three are optional.
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ENV SENTRY_ORG=$SENTRY_ORG SENTRY_PROJECT=$SENTRY_PROJECT

# Server-side secrets are read at request time, but a few modules touch env
# at import during the build — give them harmless placeholders.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build \
    NEXTAUTH_SECRET=build-placeholder \
    GOOGLE_CLIENT_ID=build GOOGLE_CLIENT_SECRET=build \
    PUSHER_APP_ID=build PUSHER_KEY=build PUSHER_SECRET=build PUSHER_CLUSTER=mt1

# Node caps its heap at ~half of physical RAM; on small hosts (t3.micro:
# ~1GB) the TypeScript pass of `next build` OOMs even when swap is free.
# Raise the cap explicitly so the build can spill into swap instead.
ENV NODE_OPTIONS=--max-old-space-size=2048
# The token is a build secret, so it never lands in an image layer. If the
# upload fails the browser maps are still on disk: drop them either way.
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    pnpm build && find .next/static -name '*.map' -delete

# ---- run: minimal standalone runtime ----
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]

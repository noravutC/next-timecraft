# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm test         # Vitest: logic tests (*.test.ts, node) and component tests (*.test.tsx, jsdom)
pnpm test:coverage # same, failing under the thresholds in vitest.config.mts (CI runs this)
pnpm lint         # ESLint (flat config)
pnpm format       # Prettier + Tailwind class sorting

# Database (Drizzle)
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Apply migrations
pnpm db:push      # Push schema directly (dev only)
pnpm db:studio    # Open Drizzle Studio

pnpm demo:reset   # Rebuild the shared guest workspace (uses DATABASE_URL; runs nightly in CI)
```

Do not run `pnpm format` repo-wide from a feature branch: `.prettierrc` enforces
single quotes but most older files are double-quoted and were never formatted, so
a full run rewrites ~230 files. Format only the files you touched.

## Testing

- **Logic**: colocated `*.test.ts`, node environment.
- **Components**: colocated `*.test.tsx` with `// @vitest-environment jsdom` as the first line, React Testing Library + `user-event`. Query by role and accessible name, not by class or test id.
- **Coverage**: thresholds in `vitest.config.mts` are a ratchet set just under the current numbers; raise them when you add tests, never lower them to pass.
- **E2E**: Playwright in `e2e/`, signing in as the guest. `e2e/a11y.spec.ts` runs axe (WCAG 2.1 A/AA) and fails on serious or critical violations: a new page should get a test there.

## Tech Stack

- Framework: Next.js 16 (App Router), React 19
- Language: TypeScript 5
- Styling: Tailwind CSS v4, shadcn/ui
- State Management: Zustand 5
- Database ORM: Drizzle ORM + PostgreSQL via Supabase

## Architecture

**TimeCraft** is a Kanban/project-management SaaS.

### Routing

- `src/app/(main)/` — authenticated route group; auth guard lives in `(main)/layout.tsx` (not middleware)
- `src/app/(main)/project/` — Kanban board (main feature)
- `src/app/api/` — REST API routes (NextAuth + custom)
- `src/app/login/` — sign-in page: Google OAuth and Continue as guest

### Authentication

**File:** `src/auth.ts` — Auth.js v5 (`next-auth` beta) config, JWT strategy, 48h session. Two providers:
- **Google** — the email must be verified by Google.
- **Guest** (Credentials) — every "Continue as guest" visitor signs in as one shared account (`GUEST_EMAIL` in `src/lib/guest.ts`), throttled per IP. Use `isGuestSession(session)` to branch: guests can't store AI keys, invite people or join boards by invitation, and get smaller daily quotas.

The session `update()` payload is never trusted: `trigger === "update"` only re-reads the user from the DB.

JWT callback (`hydrateTokenFromDb`) upserts the user into the DB on sign-in, then enriches the token with:
- `organizationId` (owner org or first membership org)
- `systemRole`: `"owner"` if user owns an org, else `"user"`
- `canCreateOrg` flag

Session type is augmented in `src/types/global/next-auth.d.ts`.

### State Management (Zustand)

The main stores in `src/store/`:
- `useProjectStore` — project list, active project (`projectIsUsing`), `needCreateProject` flag
- `useColumnStore` — Kanban columns keyed by id
- `useTaskStore` — tasks keyed by id, with optimistic updates + `updateTaskFromRealtime()`
- `useOrganizationStore` — org context
- `useAutomationStore` — one board's rules, templates and webhooks (`fetchBoard`), and `intent`: what the board asks the Automation view to open (a rule from the note about it, the templates from "New task")

**Pattern**: every mutating action (1) captures a snapshot, (2) applies optimistic update, (3) calls API, (4) reverts on error. Status field is one of `"none" | "fetching" | "creating" | "updating" | "deleting" | "error"` (defined as `LoaderStatus` in `src/types/global/types.d.ts`).

### Service Layer

`src/services/*.service.ts` — thin wrappers around Axios calls. Axios client in `src/lib/axios.ts` injects an `Authorization: Bearer` token on every request.

### Data Layer

- **DB**: PostgreSQL via Supabase, accessed with `drizzle-orm` + `postgres` driver (`src/db/index.ts`; prepared statements disabled for the pooler)
- **Schema**: `src/db/schema/` — each table in its own file, re-exported from `index.ts`
- **Types**: Drizzle `InferSelectModel` / `InferInsertModel` in `src/types/` — do not write manual type definitions for DB rows
- **Queries**: shared helpers in `src/db/uniq-query/` (`hasPermission()` is **deprecated** — use `authorize()` from `@/lib/rbac/authorize` instead)

### Key Schema Concepts

- **`orderFraction`** — fractional-indexing string used for drag-and-drop ordering on both columns and tasks; never use integer indices. Helpers: `generateFractionBetween()` and `assignBulkIndexes()` in `src/helper/utils/fraction-string-indexing.ts`.
- **Indexes** — declared next to each table (third `pgTable` argument). Search and the board text filter rely on `pg_trgm` GIN indexes, so keep them as `ILIKE '%…%'`; ordering by `orderFraction` in SQL must say `COLLATE "C"` to use `tasks_column_order_idx`. Measure changes with `scripts/perf/` (k6, scratch DB only).
- **Soft delete on columns** — `isDeleted`, `deletedAt`, `purgeAt` fields; always filter these out in queries
- **Done column** — one column per board has `isDone` (unique index; new boards get it on the template's last column). "Done" is a place, not a flag on the task: a task is finished when it sits in that column (`finishColumnOf()`, `toggleTaskDone()` in `src/components/project/task-completion.ts`). `tasks.completedAt` / `completedFromColumnId` are maintained by Postgres triggers (migration `0023`) on every path that moves a task or flips the flag, so app code never writes them.
- **Insights** — the third board view (`?view=insights`, `src/app/(main)/project/_components/insights/`). `getBoardInsights()` in `src/db/uniq-query/project/insights-utils.ts` counts everything in SQL from `tasks.completedAt`, `createdAt` and `dueDate`, the Done column and `task_activities` (no reporting table). The page shows two groups: the chosen period (finished, new, time to finish, on time, time in each column) and right now (open, overdue, needs attention, coming up, workload). Week and period math, and the copy shared with the email, are in `src/helper/utils/insights.ts`; what the page draws is derived in `insights-operations.ts` beside the components. "Stuck" = out of the first column and no column change for `STUCK_AFTER_DAYS`; "Coming up" = due within `UPCOMING_DAYS`.
- **Weekly digest** — a row in `digest_subscriptions` means it is on for that person on that board. `sendWeeklyDigests()` in `src/lib/jobs/run-jobs.ts` sends on Monday from 9:00 in the workspace's zone and claims `lastSentWeek` before sending. The email is built by `buildWeeklyDigest()` (`src/lib/email/weekly-digest.ts`), which the preview route reuses.
- **Automation** — the fourth board view (`?view=automation`, `src/app/(main)/project/_components/automation/`): rules, task templates, webhooks and their history. A rule is `trigger` + `conditions` + `actions` (JSON on `automation_rules`, typed in `src/db/schema/automation-rule.table.ts`). Every change to a task goes through `recordTaskActivities()`, which calls `announceTaskChanges()` (`src/lib/automation/engine.ts`): that is the one place rules and webhooks listen, so a new way to change a task only has to record its activity. Rules for a change run in that request and the routes hand back the rows as rules left them (`refreshTasks()`); rules for a date or a time run from `runAutomationJobs()` (`src/lib/automation/jobs.ts`, called by the cron). A rule's own changes are announced again, up to `MAX_RULE_DEPTH`. What a rule points at is checked on save (`missingRef()`) and again when it runs: a rule that lost something is paused with `brokenReason`. The matching, schedule math and the sentences are pure, in `src/helper/utils/automation*.ts`; what the page draws is derived in the `*-operations.ts` files beside the components.
- **Webhooks** — `webhook_deliveries` is the outbox: a row per message, written when the event happens, sent after the response (`deliverWebhooks()`), retried by the cron (`nextAttemptAt` is also the claim). Sending goes through `postWebhook()` (`src/lib/automation/webhook-send.ts`), which refuses private addresses at connect time: never call `fetch` on an address a user typed. Secrets are encrypted with `encryptSecret()` and never sent to the browser again.
- **`tags`** — `text[]` array on both projects and tasks

### RBAC (Standard pattern — use this, not ad-hoc checks)

**Location:** `src/lib/rbac/`

- `permissions.ts` — `Permission` union (`resource:action`) + `ROLE_PERMISSIONS: Record<ProjectRole, ReadonlySet<Permission>>`. Rules and webhooks need `automation:manage` (owner, admin); task templates need `template:manage` (also editors)
- `can.ts` — `can(role, permission): boolean` — pure, no DB
- `authorize.ts` — `authorize(userId, projectIds, permission): Promise<boolean>` and `authorizeOrThrow(...)` (throws `ForbiddenError`)

Always use `authorize` / `authorizeOrThrow`. Never re-implement role/permission logic in routes. Add new permissions to the union + each role's set in `permissions.ts`.

### Security

- **CSP** is set per request in `src/proxy.ts` (Next 16's middleware): scripts run only with that request's nonce (`'strict-dynamic'`). Pages render dynamically for this (`dynamic` in `src/app/layout.tsx`); a prerendered page would lose its scripts. Allowed origins live in `src/lib/security/csp.ts`. The other security headers are static in `next.config.ts`.
- **Quotas**: per-minute limits and daily quotas (`enforceQuota`, `src/lib/api/quotas.ts`) are in memory, keyed by user or by IP for guests. Daily ceilings that must survive a restart are counted from the DB (`src/db/uniq-query/quota/daily-usage.ts`, `assertUnderDailyLimit`).
- **Database TLS**: `src/db/ssl.ts` decides it for the app, drizzle-kit and scripts: `require` for any non-local host.
- **Storage**: the comment-media bucket is public but limited to 50MB and image/video types (`scripts/harden-storage-bucket.ts`); upload URLs are quota-limited.
- **Realtime**: every Pusher channel is private and authorized in `/api/pusher/auth`.

### Observability

- **Logs**: `logger` (pino, `src/lib/logger.ts`); `createHandle` logs every API request. Lines carry `traceId` when tracing is on.
- **Traces and metrics**: OpenTelemetry, set up in `src/instrumentation.ts` + `src/lib/telemetry/otel.ts`, off unless `OTEL_EXPORTER_OTLP_ENDPOINT` is set. Add metrics in `src/lib/telemetry/metrics.ts` (instruments are created on first use). With `SENTRY_DSN`, Sentry owns the tracer provider: don't register a second one.
- **Web Vitals**: `WebVitalsReporter` (root layout) posts to `/api/vitals`, a sessionless route like `/api/health`.
- The OpenTelemetry packages are pinned to the versions Sentry uses (SDK 2.9.x, exporters 0.220.x). Upgrade them together with `@sentry/nextjs`.

### API Handler Wrappers (Standard pattern — use this for every route)

**Location:** `src/lib/api/`

- `errors.ts` — `AppError`, `Unauthorized/Forbidden/BadRequest/NotFoundError`. Throw these from inside handlers; the wrapper converts them to JSON responses with the right status code.
- `handle.ts` — `createHandle` / `createParamHandle`

```ts
// No params
export const POST = createHandle<BodyType>(
  { body: zodSchema, permission: "task:create", resolveProjectIds: ({ body }) => [...] },
  async ({ userId, body, session }) => { ... return NextResponse.json(...) }
);

// With route params (Next 16: params is a Promise — wrapper awaits it)
export const PATCH = createParamHandle<{ id: string }, BodyType>(
  { body: zodSchema, permission: "task:update", resolveProjectIds: ({ params }) => [...] },
  async ({ params, body, userId }) => { ... }
);
```

The wrapper handles: session 401, Zod body validation → 400, permission check → 403, unified error catch (`AppError.statusCode` → response). When `projectIds` need a DB lookup that the handler also needs, skip `permission` in config and call `authorizeOrThrow()` directly inside the handler after the lookup.

**Example route:** `src/app/api/task/route.ts` (POST) — uses `createHandle` + Zod + inline `authorizeOrThrow` after column lookup.

**Migration status:** every route uses the wrappers (except the Auth.js handler and the sessionless `/api/health`, `/api/vitals` and `/cal/[token]`). Keep it that way for new routes.

### Existing helpers — always check before writing new utilities

Before writing new utility code, scan these directories for an existing helper:
- `src/lib/` — framework/integration code (`axios.ts`, `pusher-client.ts`, `pusher-server.ts`, `utils.ts`'s `cn()`, plus `lib/rbac/`, `lib/api/` above)
- `src/helper/utils/` — pure utilities (`fraction-string-indexing.ts`, `date-format.ts`, `object.ts`'s `toRecord`/`toValueRecord`, etc.)
- `src/db/uniq-query/` — shared DB query helpers grouped by domain

If a helper exists, reuse it. If you need something new and pure, add it to `src/helper/utils/`. If it's framework/integration glue, add it to `src/lib/`.

### API Routes

All routes follow: verify session → check permission → execute → return `{ message, data }`. New routes should use `createHandle` / `createParamHandle` from `src/lib/api/handle.ts`.

Relevant routes for the board:
- `POST /api/project` — fetch (mode `"fetch"`) or create project
- `PATCH/DELETE /api/project/[id]` — update / delete project
- `POST /api/column` — create column; `PATCH/DELETE /api/column/[ids]`
- `POST /api/task/columns` — bulk-fetch tasks by column ids
- `POST /api/project/[id]/insights` — the Insights view's numbers for 4 or 12 weeks
- `GET /api/project/[id]/automation` — rules, templates and webhooks; `POST …/automation/rules`, `PATCH/DELETE …/automation/rules/[ruleId]`; `GET …/automation/history`; `POST …/automation/deliveries/[deliveryId]` sends a webhook message again
- `GET/POST /api/project/[id]/templates`, `PATCH/DELETE …/templates/[templateId]`, `POST …/templates/[templateId]/use` — a new task from a template
- `POST /api/project/[id]/webhooks`, `PATCH/DELETE …/webhooks/[webhookId]`, `POST …/webhooks/test`
- `GET/PUT /api/project/[id]/digest` — your weekly digest setting; `GET …/digest/preview` renders this week's email
- `PATCH/DELETE /api/task/[ids]` — update / delete tasks (comma-separated ids)

### Real-time

Pusher WebSocket (`src/lib/pusher-client.ts` / `pusher-server.ts`). Every channel is private: subscribe with `privateChannel('project-' + id)` (→ `private-project-{id}`) and the server authorizes it in `/api/pusher/auth`. Hook `useRealtimeBoard(projectId)` subscribes to the project channel and calls `useTaskStore.updateTaskFromRealtime()` on `task-updated` events.

A route sends its own change with `triggerExclusive()` (everyone but the browser that made it). What a rule or a scheduled job changes is sent with `triggerAll()`: no browser shows it yet, the one that started it included.

### Context Providers

- **`SettingsContext`** (`src/context/kanban/setting-provider.tsx`) — drag-and-drop tuning (auto-scroll, scroll speeds). Read through its default value; no provider is mounted.

### Board Dialogs (Switch Boards / Create Board / Board Settings / Delete)

All live in `src/components/board-dialogs/` and are mounted once by `board-dialogs.tsx`. Open them through `useNavStore`: `setBoardDialog('switch' | 'create' | 'settings')`, or `openBoardSettings(tab)` for a tab (`'general' | 'tags' | 'members' | 'danger'`). ⌘K / Ctrl+K toggles the switcher.

Build new ones from the Dialog primitives like the existing ones: `DialogContent` has no padding, compose `DialogHeader` / `DialogBody` / `DialogFooter`. Sizes follow the redesign prototype: switcher is a 600px command palette (cmdk), create board 640px, board settings 720×620 with underline tabs. Deleting a board goes through `ConfirmDialog` with `confirmPhrase` (type the board name).

### Drag-and-Drop

Uses `@atlaskit/pragmatic-drag-and-drop` with auto-scroll. Column and card move logic lives in `src/app/(main)/project/_components/` as `computeCardMove()` / `computeColumnMove()`. After a move, the store is updated optimistically and Pusher broadcasts to collaborators.

### Utilities

- **`cn()`** — `src/lib/utils.ts`, clsx + twMerge for Tailwind class merging
- **`toRecord()` / `toValueRecord()`** — `src/helper/utils/object.ts`, converts arrays to keyed records (used in stores)

### Path Alias

`@/*` maps to `src/*`.

## Required Environment Variables

```
DATABASE_URL=                    # Supabase PostgreSQL connection string (TLS is added for non-local hosts)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
ANTHROPIC_API_KEY=               # optional — AI Task Breakdown (route returns 503 without it)
RESEND_API_KEY=                  # optional — invite emails (skipped with a log if unset; copy link still works)
EMAIL_FROM=                      # optional — sender, defaults to Resend test sender
APP_URL=                         # optional — base URL for links in emails, falls back to NEXTAUTH_URL
CRON_SECRET=                     # optional: guards /api/cron/run (reminders, notification emails, weekly digests, column purge, rules on a date or a schedule, webhook retries); without it the route refuses every call
WEBHOOK_ALLOW_INSECURE=          # local testing only: "true" lets webhooks go to http:// and to this machine. Ignored in production
NEXTAUTH_URL=                    # public site URL (OAuth callbacks)
NEXT_PUBLIC_SUPABASE_URL=        # comment attachments (storage)
SUPABASE_SERVICE_ROLE_KEY=       # comment attachments (signed upload URLs); server only
AI_ENCRYPTION_KEY=               # encrypts AI keys users save in AI settings
SENTRY_DSN=                      # optional — server error reporting
NEXT_PUBLIC_SENTRY_DSN=          # optional — browser error reporting (inlined at build: a Docker build arg)
SENTRY_AUTH_TOKEN=               # optional, build time only: uploads source maps (with SENTRY_ORG, SENTRY_PROJECT)
OTEL_EXPORTER_OTLP_ENDPOINT=     # optional: export traces and metrics over OTLP (off without it)
OTEL_EXPORTER_OTLP_HEADERS=      # optional: auth for that endpoint, e.g. Authorization=Basic ...
LOG_LEVEL=                       # optional — pino level, defaults to info
```

## Skills system

Project-local skills live in `.claude/skills/<name>/SKILL.md`. Claude Code auto-discovers them via YAML frontmatter — there is no manual index.

### When to update a skill

- A user correction reveals a wrong pattern, library, or convention you used.
- You had to fix your own output a second time to match an existing codebase pattern.
- You discovered a real pattern in code that no skill captures.

When any of these happen, open the relevant `SKILL.md` and update it. The **`skill-authoring` skill** governs the *how* — size caps, frontmatter quality, pre-flight audit, stability gate, and update protocol. It will auto-trigger the moment you start editing under `.claude/skills/`. Read it first; do not write skill content from memory of these rules.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm format       # Prettier + Tailwind class sorting

# Database (Drizzle)
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Apply migrations
pnpm db:push      # Push schema directly (dev only)
pnpm db:studio    # Open Drizzle Studio
```

No test runner is configured. No ESLint is configured — only Prettier.

## Tech Stack

- Framework: Next.js 16 (App Router), React 19
- Language: TypeScript 5
- Styling: Tailwind CSS v4, shadcn/ui
- State Management: Zustand 5 (global), MobX (not yet actively used)
- Database ORM: Drizzle ORM + PostgreSQL via Supabase

## Architecture

**TimeCraft** is a Kanban/project-management SaaS.

### Routing

- `src/app/(main)/` — authenticated route group; auth guard lives in `(main)/layout.tsx` (not middleware)
- `src/app/(main)/project/` — Kanban board (main feature)
- `src/app/api/` — REST API routes (NextAuth + custom)
- `src/app/login/` — Google OAuth login page
- `src/middleware.ts` — minimal auth redirect for unauthenticated users

### Authentication

**File:** `src/auth.ts` — NextAuth 4 config, Google OAuth only, JWT strategy, 48h session.

JWT callback (`hydrateTokenFromDb`) upserts the user into the DB on sign-in, then enriches the token with:
- `organizationId` (owner org or first membership org)
- `systemRole`: `"owner"` if user owns an org, else `"user"`
- `canCreateOrg` flag

Session type is augmented in `src/types/global/next-auth.d.ts`.

### State Management (Zustand)

Four stores in `src/store/`:
- `useProjectStore` — project list, active project (`projectIsUsing`), `needCreateProject` flag
- `useColumnStore` — Kanban columns keyed by id
- `useTaskStore` — tasks keyed by id, with optimistic updates + `updateTaskFromRealtime()`
- `useOrganizationStore` — org context

**Pattern**: every mutating action (1) captures a snapshot, (2) applies optimistic update, (3) calls API, (4) reverts on error. Status field is one of `"none" | "fetching" | "creating" | "updating" | "deleting" | "error"` (defined as `LoaderStatus` in `src/types/global/types.d.ts`).

### Service Layer

`src/services/*.service.ts` — thin wrappers around Axios calls. Axios client in `src/lib/axios.ts` injects an `Authorization: Bearer` token on every request.

### Data Layer

- **DB**: PostgreSQL via Supabase, accessed with `drizzle-orm` + `postgres` driver (`src/db/index.ts`; prepared statements disabled for the pooler)
- **Schema**: `src/db/schema/` — each table in its own file, re-exported from `index.ts`
- **Types**: Drizzle `InferSelectModel` / `InferInsertModel` in `src/types/` — do not write manual type definitions for DB rows
- **Queries**: shared helpers in `src/db/uniq-query/` (e.g. `hasPermission()`)

### Key Schema Concepts

- **`orderFraction`** — fractional-indexing string used for drag-and-drop ordering on both columns and tasks; never use integer indices. Helpers: `generateFractionBetween()` and `assignBulkIndexes()` in `src/helper/utils/fraction-string-indexing.ts`.
- **Soft delete on columns** — `isDeleted`, `deletedAt`, `purgeAt` fields; always filter these out in queries
- **`tags`** — `text[]` array on both projects and tasks

### API Routes

All routes follow: verify session → check `hasPermission()` → execute → return `{ message, data }`.

Relevant routes for the board:
- `POST /api/project` — fetch (mode `"fetch"`) or create project
- `PATCH/DELETE /api/project/[id]` — update / delete project
- `POST /api/column` — create column; `PATCH/DELETE /api/column/[ids]`
- `POST /api/task/columns` — bulk-fetch tasks by column ids
- `PATCH/DELETE /api/task/[ids]` — update / delete tasks (comma-separated ids)

### Real-time

Pusher WebSocket (`src/lib/pusher-client.ts` / `pusher-server.ts`). Hook `useRealtimeBoard(projectId)` subscribes to channel `project-{projectId}` and calls `useTaskStore.updateTaskFromRealtime()` on `task-updated` events.

### Context Providers

- **`BottomBarProvider`** (`src/context/bottom-bar-provider.tsx`) — manages bottom tab: `'bar-board' | 'bar-templates' | 'bar-calendar'`
- **`ProjectMenuProvider`** (`src/context/project/project-menu-provider.tsx`) — menu state: `'settings' | 'new-project' | 'none'`
- **`LoadingProvider`** (`src/context/loading-provider.tsx`) — global loading flag

### Project Layout / Settings Slide Transition

`ProjectMenuProvider` holds menu state. `ProjectToolsLayout` (`src/app/(main)/project/project-layout.tsx`) uses `AnimatePresence` (framer-motion) to slide `ProjectSettingsPanel` in from the right over the Board — **do not use a Dialog or Sheet for project settings**.

### Drag-and-Drop

Uses `@atlaskit/pragmatic-drag-and-drop` with auto-scroll. Column and card move logic lives in `src/app/(main)/project/_components/` as `computeCardMove()` / `computeColumnMove()`. After a move, the store is updated optimistically and Pusher broadcasts to collaborators.

### Utilities

- **`cn()`** — `src/lib/utils.ts`, clsx + twMerge for Tailwind class merging
- **`toRecord()` / `toValueRecord()`** — `src/helper/utils/object.ts`, converts arrays to keyed records (used in stores)

### Path Alias

`@/*` maps to `src/*`.

## Required Environment Variables

```
DATABASE_URL=                    # Supabase PostgreSQL connection string
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

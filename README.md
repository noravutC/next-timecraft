# TimeCraft

A real-time Kanban project management SaaS built with Next.js 16, React 19, and TypeScript.

[![CI](https://github.com/noravutC/next-timecraft/actions/workflows/ci.yml/badge.svg)](https://github.com/noravutC/next-timecraft/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql)

## Features

- **AI Task Breakdown** — Type a goal and Claude streams it into actionable cards on the board
- **Kanban Board** — Drag-and-drop columns and cards with smooth, conflict-free ordering
- **Real-time Collaboration** — Changes sync instantly across all project members
- **Optimistic UI** — Every action feels instant with automatic rollback on failure
- **Project Settings** — Animated slide-in panel for managing name, appearance, and tags
- **Multi-tenant** — Organizations with projects and members, each with role-based access control
- **Google OAuth** — Secure sign-in with session management and organization context
- **Soft Delete** — Safe column deletion with scheduled purge support

## Screenshots

**Login Page**
![TimeCraft Login](docs/screenshot-login.png)

**Kanban Board**
![TimeCraft Kanban Board](docs/screenshot-board.png)


## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui, Framer Motion |
| State | Zustand 5 |
| Database | PostgreSQL (Supabase) via Drizzle ORM |
| Auth | NextAuth 4 — Google OAuth, JWT |
| Real-time | Pusher WebSocket |
| Drag & Drop | Atlaskit pragmatic-drag-and-drop |
| Package Manager | pnpm |

## Architecture

```
src/
├── app/
│   ├── (main)/        # Authenticated route group
│   │   └── project/   # Kanban board + settings panel
│   ├── api/           # REST API routes
│   └── login/         # Google OAuth login
├── store/             # Zustand global state
├── services/          # API service layer
├── db/                # Drizzle ORM schema & queries
├── components/        # UI components (shadcn/ui)
└── types/             # TypeScript type definitions
```

## AI Task Breakdown — design notes

The board has an **AI breakdown** button: describe a goal, pick a column, and Claude
(`claude-opus-4-8`, via the official `@anthropic-ai/sdk`) turns it into cards that
appear one by one as they are generated.

**How it streams.** `POST /api/ai/task-breakdown` (session + RBAC-checked like every
other route) opens a streaming request to Claude and forwards results to the browser
as Server-Sent Events. The client inserts each subtask through the existing task
store, so AI-created cards get the same optimistic updates and Pusher broadcast as
manually created ones.

**Prompt design.** The system prompt instructs Claude to answer in **NDJSON** — one
`{"title", "description", "priority"}` object per line, ordered by execution order,
in the user's language. Each completed line is validated with Zod on the server;
lines that fail validation are silently dropped, so the client can never receive a
malformed task.

**Trade-offs considered.**
- *NDJSON vs. structured outputs (`output_config.format`)*: structured outputs give a
  schema-guaranteed document, but the guarantee applies to the whole response — you
  can't validate-and-forward items while the stream is still running without a
  partial-JSON parser. NDJSON keeps streaming trivial (split on newline) and moves the
  schema guarantee into per-line Zod validation instead.
- *Server-side vs. client-side task creation*: the server only proxies the AI; the
  client creates tasks through the normal `POST /api/task` path. This reuses the
  existing permission checks, optimistic store logic, and realtime broadcast instead
  of duplicating them inside the AI route.
- *Error handling*: rate limits / auth / network failures from the Anthropic SDK are
  mapped to human-readable SSE `error` events (the SDK already retries transient
  429/5xx twice with backoff). If the stream dies mid-way, the user keeps the cards
  that were already created — nothing is rolled back.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Supabase PostgreSQL database
- Google OAuth credentials
- Pusher account

### Setup

```bash
pnpm install
pnpm db:push
pnpm dev
```

### Environment Variables

```env
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
ANTHROPIC_API_KEY=   # optional — enables AI Task Breakdown; feature returns 503 without it
```

### Commands

```bash
pnpm dev      # Start dev server (Turbopack)
pnpm build    # Production build
pnpm format   # Prettier + Tailwind class sorting
```

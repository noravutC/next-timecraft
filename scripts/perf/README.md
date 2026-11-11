# Load testing

Measures the API under concurrent users on a database big enough for query
plans to matter. Everything here runs against a **throwaway local Postgres**:
`seed.sql` inserts about 98,000 tasks and must never touch a real database.

## Run it

```bash
# 1. a scratch database with the schema
createdb timecraft_perf
export PERF_DB=postgres://postgres@localhost:5432/timecraft_perf
DATABASE_URL=$PERF_DB pnpm db:migrate

# 2. the app on that database (DATABASE_URL in the shell wins over .env.local)
DATABASE_URL=$PERF_DB pnpm build && DATABASE_URL=$PERF_DB pnpm start

# 3. sign in once at http://localhost:3000/login with "Continue as guest",
#    create a board, and copy the authjs.session-token cookie

# 4. the data, then the test
psql "$PERF_DB" -v ON_ERROR_STOP=1 -f scripts/perf/seed.sql
k6 run -e COOKIE="authjs.session-token=<value>" -e VUS=50 scripts/perf/board.k6.js
```

Each virtual user opens the big board (4,000 cards per column), filters it,
searches, reads a task and opens My tasks, with a second of think time
between steps. The run fails if more than 1% of requests fail or p95 goes
over 500 ms, the target in the main README.

## Results, 2026-11-10

50 virtual users, production build, Postgres 14 on a laptop (WSL2), before
and after migration `0022_hot_path_indexes`:

| Request (p95)      | No indexes | With indexes |
| ------------------ | ---------- | ------------ |
| All requests       | 733 ms     | 98 ms        |
| Board, first page  | 895 ms     | 144 ms       |
| Board, text filter | 946 ms     | 100 ms       |
| Search             | 835 ms     | 68 ms        |
| My tasks           | 329 ms     | 70 ms        |
| Throughput         | 70 req/s   | 112 req/s    |

Absolute numbers depend on the machine; the ratio is the point.

## Board first page, 2026-11-11

The first page used to rank every card of every requested column with
`row_number()` and keep 21 per column. It now takes each column's first 21
straight from `tasks_column_order_idx` and glues the columns with
`UNION ALL`. On the big board (5 columns, about 3,800 open cards each):

| Measure                                  | Window function | Per-column LIMIT |
| ---------------------------------------- | --------------- | ---------------- |
| The page query alone (`EXPLAIN ANALYZE`) | 47.6 ms         | 0.2 ms           |
| Buffers read by it                       | 3,812           | 120              |
| Whole request, median of 40, one user    | 66 ms           | 39 ms            |

The whole request is from a browser against `pnpm dev`, so it includes the
other queries of the route (totals, priority counts, assignees) and dev-mode
overhead. With a text filter the two forms take the same time.

## Insights, 2026-11-11

The Insights view runs nine aggregate queries at once. On the big board
(4,000 cards per column: 15,400 open, 1,450 finished in the last 12 weeks,
5,000 stuck, 4,200 overdue, 1,500 due within a week; 196,000 history rows
in the database) all nine together take about 75 ms from Node, 12 weeks or
4, and the weekly digest's queries about 60 ms. They read through
`columns_project_idx`, `tasks_column_order_idx` and
`task_activities_task_created_idx`, so no new index was added.

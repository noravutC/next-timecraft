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

// Load test: people opening a board, filtering, searching and reading a
// task. Run it against a local server on a seeded throwaway database
// (scripts/perf/README.md), never against production.
//
//   k6 run -e COOKIE="authjs.session-token=..." scripts/perf/board.k6.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const TERMS = ['webhook', 'invoice', 'timeout', 'checkout crash', 'banner'];

export const options = {
  scenarios: {
    boards: {
      executor: 'ramping-vus',
      stages: [
        { duration: '15s', target: Number(__ENV.VUS || 20) },
        { duration: '45s', target: Number(__ENV.VUS || 20) },
        { duration: '5s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // the service-level target in the README
    http_req_duration: ['p(95)<500'],
    // listed so the summary breaks these out one by one
    'http_req_duration{name:tasks: first page}': ['p(95)<500'],
    'http_req_duration{name:tasks: text filter}': ['p(95)<500'],
    'http_req_duration{name:search}': ['p(95)<500'],
    'http_req_duration{name:my tasks}': ['p(95)<500'],
  },
};

// Guests are rate limited per IP, so each virtual user gets its own
// address: 20 users behave like 20 visitors, not one visitor 20 times over.
const params = () => ({
  headers: {
    cookie: __ENV.COOKIE,
    'content-type': 'application/json',
    'x-forwarded-for': `10.0.${Math.floor(__VU / 250)}.${(__VU % 250) + 1}`,
  },
});

const api = (method, path, body, name) =>
  http.request(
    method,
    `${BASE}/api${path}`,
    body ? JSON.stringify(body) : null,
    { ...params(), tags: { name } },
  );

/** The big board (the one seed.sql did not name), its columns and a task. */
export function setup() {
  const projects = api(
    'POST',
    '/project',
    { projectIds: '', fetchAll: true },
    'setup',
  ).json('data');
  const board = projects.find((p) => !p.name.startsWith('Seed board ')).id;
  const colIds = api('GET', `/column/${board}?limit=50`, null, 'setup')
    .json('data')
    .map((c) => c.id);
  const task = api('POST', '/task/columns', { colIds, limit: 1 }, 'setup').json(
    'data',
  )[0].id;
  return { board, colIds, task };
}

export default function boardSession({ board, colIds, task }) {
  const now = Date.now();
  const dueBounds = {
    today: new Date(now).toISOString(),
    weekEnd: new Date(now + 7 * 86400000).toISOString(),
  };

  group('open board', () => {
    api('POST', '/project', { projectIds: '', fetchAll: true }, 'project list');
    api('GET', `/column/${board}?limit=50`, null, 'columns');
    const tasks = api(
      'POST',
      '/task/columns',
      { colIds, limit: 20 },
      'tasks: first page',
    );
    check(tasks, { 'board loads': (r) => r.status === 200 });
    api('POST', '/task/filter-counts', { colIds, dueBounds }, 'filter counts');
  });
  sleep(1);

  group('filter and search', () => {
    const q = TERMS[Math.floor(Math.random() * TERMS.length)];
    api(
      'POST',
      '/task/columns',
      { colIds, limit: 20, filter: { q } },
      'tasks: text filter',
    );
    const search = api(
      'GET',
      `/search?q=${encodeURIComponent(q)}`,
      null,
      'search',
    );
    check(search, { 'search answers': (r) => r.status === 200 });
  });
  sleep(1);

  group('read a task', () => {
    api('GET', `/task/${task}`, null, 'task detail');
    api('GET', `/task/${task}/comments`, null, 'task comments');
    api('GET', '/my-tasks', null, 'my tasks');
  });
  sleep(1);
}

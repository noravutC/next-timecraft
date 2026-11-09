// app/api/search/route.ts: GET ?q=&projectId= : tasks on your boards whose
// title, description or comments hold the words

import { searchTasks } from '@/db/uniq-query/search/search-utils';
import { createHandle } from '@/lib/api/handle';
import { isUuid } from '@/lib/api/params';
import { NextResponse } from 'next/server';

const MIN_LENGTH = 2;
const MAX_LENGTH = 100;
const LIMIT = 8;

export const GET = createHandle({}, async ({ request, userId }) => {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, MAX_LENGTH);
  const rawProject = url.searchParams.get('projectId');
  const projectId = rawProject && isUuid(rawProject) ? rawProject : null;

  const data =
    query.length < MIN_LENGTH
      ? []
      : await searchTasks({ userId, query, projectId, limit: LIMIT });
  return NextResponse.json(
    { data, message: 'Search success', status: 200 },
    { status: 200 },
  );
});

import { getActiveColumnLinks } from '@/db/uniq-query/column/column-utils';
import { countFilterOptions } from '@/db/uniq-query/task/task-filter';
import { NotFoundError } from '@/lib/api/errors';
import { createHandle } from '@/lib/api/handle';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import { NextResponse } from 'next/server';
import {
  filterCountsSchema,
  type FilterCountsBody,
} from '@/validations/task.validation';

/** How many tasks each Due date option and "Assigned to me" would show. */
export const POST = createHandle<FilterCountsBody>(
  { body: filterCountsSchema },
  async ({ body, userId }) => {
    const links = await getActiveColumnLinks([...new Set(body.colIds)]);
    if (links.length === 0) throw new NotFoundError('Columns not found');
    await authorizeOrThrow(
      userId,
      [...new Set(links.map((l) => l.projectId))],
      'project:view',
    );
    const data = await countFilterOptions(
      links.map((l) => l.columnId),
      userId,
      body.dueBounds,
    );
    return NextResponse.json({ data, message: 'Filter counts', status: 200 });
  },
);

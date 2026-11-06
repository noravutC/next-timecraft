import { triggerExclusive } from '@/lib/pusher-server';
import type { ColumnRow } from '@/types';

// events on `project-{id}`; the socket that made the change is left out
const send = (
  request: Request,
  projectId: string,
  event: string,
  data: unknown,
) =>
  triggerExclusive(request, `project-${projectId}`, event, data).catch((e) =>
    console.error(`Pusher ${event} failed:`, e),
  );

const byBoard = <T extends { projectId: string }>(rows: T[]) => {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    groups.set(row.projectId, [...(groups.get(row.projectId) ?? []), row]);
  }
  return groups;
};

/** Columns added, renamed, recolored, moved or restored. */
export const broadcastColumns = (request: Request, columns: ColumnRow[]) => {
  for (const [projectId, rows] of byBoard(columns)) {
    void send(request, projectId, 'columns-upserted', rows);
  }
};

export const broadcastColumnsDeleted = (
  request: Request,
  columns: { columnId: string; projectId: string }[],
) => {
  for (const [projectId, rows] of byBoard(columns)) {
    void send(
      request,
      projectId,
      'columns-deleted',
      rows.map((r) => r.columnId),
    );
  }
};

/**
 * The board itself or who's on it changed. A ping, not the row: the cover
 * image alone can be over Pusher's size limit, so members fetch the board.
 */
export const broadcastBoardsChanged = (
  request: Request,
  projectIds: string[],
) => {
  for (const projectId of new Set(projectIds)) {
    void send(request, projectId, 'board-changed', {});
  }
};

export const broadcastBoardDeleted = (request: Request, projectId: string) =>
  void send(request, projectId, 'board-deleted', {});

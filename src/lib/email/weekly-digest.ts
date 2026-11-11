import {
  getDigestBoard,
  getDigestContents,
} from '@/db/uniq-query/project/digest-utils';
import { boardUrl } from '@/helper/utils/board-url';
import { digestEmailContent, digestIsEmpty } from '@/helper/utils/digest-email';
import { appUrl } from './send-email';
import { WeeklyDigestEmail } from './templates/weekly-digest';

/**
 * The weekly digest for a board, as sent on the Monday `weekKey`: its
 * subject and the email itself. `empty` says the week had nothing to
 * report, which the job doesn't send. Null when the board is gone or has
 * no Done column.
 */
export async function buildWeeklyDigest(projectId: string, weekKey: string) {
  const board = await getDigestBoard(projectId);
  if (!board) return null;
  const contents = await getDigestContents(projectId, weekKey, board.timeZone);
  if (!contents) return null;
  const { subject, ...props } = digestEmailContent(contents, {
    name: board.name,
    weekKey,
    timeZone: board.timeZone,
  });
  return {
    subject,
    empty: digestIsEmpty(contents),
    email: WeeklyDigestEmail({
      ...props,
      insightsUrl: `${appUrl()}${boardUrl({ board: projectId, view: 'insights' })}`,
    }),
  };
}

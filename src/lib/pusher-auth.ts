import { getTaskProjectLink } from '@/db/uniq-query/comment/comment-utils';
import { parsePrivateChannel } from '@/helper/utils/realtime-channel';
import { authorize } from '@/lib/rbac/authorize';

/** May this user listen on `channel`? Same rule as reading that data via the API. */
export async function canSubscribe(
  userId: string,
  channel: string,
): Promise<boolean> {
  const target = parsePrivateChannel(channel);
  if (!target) return false;

  switch (target.kind) {
    case 'user':
      return target.id === userId;
    case 'project':
      return authorize(userId, [target.id], 'project:view');
    case 'task': {
      const link = await getTaskProjectLink(target.id);
      return link ? authorize(userId, [link.projectId], 'project:view') : false;
    }
  }
}

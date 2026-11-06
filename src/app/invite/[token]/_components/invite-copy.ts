import type { ProjectRole } from '@/lib/rbac/permissions';

/**
 * How the invited role reads in a sentence, and what it lets you do. Hints
 * follow ROLE_PERMISSIONS: viewers can only view and react.
 */
export const ROLE_JOIN_COPY: Record<
  ProjectRole,
  { article: 'a' | 'an'; hint: string }
> = {
  owner: { article: 'an', hint: 'You can manage everything once you join.' },
  admin: {
    article: 'an',
    hint: 'You can manage cards, columns and members once you join.',
  },
  editor: { article: 'an', hint: 'You can add and move cards once you join.' },
  viewer: {
    article: 'a',
    hint: 'You can view the board and react to comments once you join.',
  },
};

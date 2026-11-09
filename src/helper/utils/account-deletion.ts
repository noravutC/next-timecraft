import type { AccountDeletionPlan, DeletionChoice } from '@/types';

type Owned = { memberCount: number; heir: { name: string } | null };

/** Hand everything to its heir where there is one; delete the rest. */
export const defaultDeletionChoices = (
  plan: AccountDeletionPlan,
): { boards: Record<string, DeletionChoice>; workspace?: DeletionChoice } => ({
  boards: Object.fromEntries(
    plan.boards.map((b) => [b.id, b.heir ? 'transfer' : 'delete']),
  ),
  workspace: plan.workspace
    ? plan.workspace.heir
      ? 'transfer'
      : 'delete'
    : undefined,
});

/** "4 members · Ploy S. becomes the owner", "Only you · deleted with its tasks" */
export const ownedItemMeta = (
  item: Owned,
  choice: DeletionChoice,
  kind: 'board' | 'workspace',
): string => {
  const people =
    item.memberCount <= 1 ? 'Only you' : `${item.memberCount} members`;
  if (choice === 'transfer' && item.heir) {
    return `${people} · ${item.heir.name} becomes the owner`;
  }
  return kind === 'board'
    ? `${people} · deleted with its tasks`
    : `${people} · deleted for everyone`;
};

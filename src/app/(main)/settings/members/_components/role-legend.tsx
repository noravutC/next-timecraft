import {
  WORKSPACE_ROLE_HINTS,
  WORKSPACE_ROLE_LABELS,
} from '@/lib/rbac/role-labels';

const ROLES = ['owner', 'admin', 'member'] as const;

/** What each role can do, under the member list. */
export const RoleLegend = () => (
  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
    {ROLES.map((role) => (
      <div key={role} className="flex flex-col gap-0.5">
        <dt className="text-xs font-medium text-ink">
          {WORKSPACE_ROLE_LABELS[role]}
        </dt>
        <dd className="text-xs leading-4.25 text-ink-subtle">
          {WORKSPACE_ROLE_HINTS[role]}
        </dd>
      </div>
    ))}
  </dl>
);

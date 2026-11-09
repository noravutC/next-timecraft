'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { YOUR_WORKSPACE_ROLE } from '@/lib/rbac/role-labels';
import { WorkspaceLogo } from './workspace-logo';

/** The workspace name in the header, opening its settings. */
export const WorkspaceMenu = ({
  workspace,
}: {
  workspace: { name: string; logo: string | null };
}) => {
  const { data: session } = useSession();
  const role = session?.user?.orgRole;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="-mx-1.5 flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 outline-none hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-ink/10 data-[state=open]:bg-surface-hover">
        <WorkspaceLogo workspace={workspace} />
        <span className="truncate text-base font-medium text-ink-muted">
          {workspace.name}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-ink-subtle" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-62">
        <div className="mb-1 flex items-center gap-2.5 border-b border-line-soft px-2.5 pt-2 pb-2.5">
          <WorkspaceLogo
            workspace={workspace}
            size="size-7"
            rounded="rounded-md"
            textSize="text-xs"
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-ink">
              {workspace.name}
            </span>
            {role && (
              <span className="text-xs text-ink-subtle">
                {YOUR_WORKSPACE_ROLE[role]}
              </span>
            )}
          </span>
        </div>
        <DropdownMenuItem asChild className="h-8 px-2.5">
          <Link href="/settings/workspace">Workspace settings</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

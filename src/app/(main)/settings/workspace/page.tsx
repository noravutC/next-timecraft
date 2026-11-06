'use client';

import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspace } from '@/components/workspace/use-workspace-name';
import { canManageWorkspace } from '@/lib/rbac/workspace-permissions';
import { SettingsHeading } from '../_components/settings-heading';
import { ArchivedBoardsSection } from './_components/archived-boards-section';
import { WorkspaceDetailsForm } from './_components/workspace-details-form';

export default function WorkspaceSettingsPage() {
  const { data: session } = useSession();
  const workspace = useWorkspace();

  if (session && !session.user?.organizationId) {
    return (
      <SettingsHeading title="General">
        You’re not in a workspace. Boards you’re invited to appear on your
        boards page.
      </SettingsHeading>
    );
  }

  return (
    <>
      <SettingsHeading title="General">
        Settings for {workspace?.name ?? 'your workspace'}. The owner and admins
        can change them.
      </SettingsHeading>
      {workspace ? (
        <>
          <WorkspaceDetailsForm
            // a fresh form when the saved workspace changes underneath it
            key={`${workspace.id}:${String(workspace.updatedAt)}`}
            workspace={workspace}
            canEdit={canManageWorkspace(session?.user?.orgRole)}
          />
          <ArchivedBoardsSection workspaceId={workspace.id} />
        </>
      ) : (
        <Skeleton className="h-80 w-full rounded-popover" />
      )}
    </>
  );
}

'use client';

import { Archive, ArchiveRestore, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LeaveBoardDialog } from '@/components/project/leave-board-dialog';
import { useBoardMemberActions } from '@/components/project/use-board-member-actions';
import { useUserStore } from '@/store';
import { TransferOwnershipRow } from './transfer-ownership-row';

const DIVIDER = <div className="h-px bg-danger-line" />;

/**
 * Danger zone tab: hand the board over and delete it (owner), archive it
 * (owners and admins), or leave it (everyone else). Each asks first.
 */
export const BoardDangerZone = ({
  archived,
  canArchive,
  canDelete,
  onArchiveClick,
  onDeleteClick,
}: {
  archived: boolean;
  /** owners and admins */
  canArchive: boolean;
  /** owners only */
  canDelete: boolean;
  onArchiveClick: () => void;
  onDeleteClick: () => void;
}) => {
  const actions = useBoardMemberActions();
  const users = useUserStore((s) => s.users);
  const isOwner = actions.myRole === 'owner';
  const heirName = actions.heir
    ? (users[actions.heir.userId]?.fullName ?? 'them')
    : 'them';

  return (
    <div className="flex flex-col gap-4">
      {!canArchive && !canDelete && (
        <p className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-muted">
          <Lock className="size-3.75 shrink-0 text-ink-subtle" />
          Only the board’s owner can delete it, and owners or admins can archive
          it.
        </p>
      )}

      {(isOwner || canArchive || canDelete) && (
        <div className="flex flex-col overflow-hidden rounded-popover border border-danger-line">
          {isOwner && (
            <TransferOwnershipRow
              members={actions.others}
              heir={actions.heir}
              onPick={actions.setHeirId}
              onTransfer={() => actions.setConfirmTransfer(true)}
            />
          )}
          {isOwner && canArchive && DIVIDER}
          {canArchive && (
            <div className="flex items-center gap-4 p-4.5">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-medium text-ink">
                  {archived ? 'Unarchive board' : 'Archive board'}
                </span>
                <span className="text-sm leading-5 text-ink-subtle">
                  {archived
                    ? 'Bring it back to your active boards.'
                    : 'Hide it from your active boards. You can restore it later.'}
                </span>
              </span>
              <Button
                variant="outline"
                onClick={onArchiveClick}
                className="shrink-0"
              >
                {archived ? (
                  <ArchiveRestore className="size-3.75" />
                ) : (
                  <Archive className="size-3.75" />
                )}
                {archived ? 'Unarchive' : 'Archive'}
              </Button>
            </div>
          )}
          {canArchive && canDelete && DIVIDER}
          {canDelete && (
            <div className="flex items-center gap-4 bg-danger-soft/40 p-4.5">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-medium text-ink">
                  Delete board
                </span>
                <span className="text-sm leading-5 text-ink-subtle">
                  Permanently remove this board and all of its tasks.
                </span>
              </span>
              <Button
                variant="destructive"
                onClick={onDeleteClick}
                className="shrink-0"
              >
                Delete board
              </Button>
            </div>
          )}
        </div>
      )}

      {!isOwner && actions.project && (
        <div className="flex items-center gap-4 rounded-popover border border-danger-line p-4.5">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-base font-medium text-ink">
              Leave this board
            </span>
            <span className="text-sm leading-5 text-ink-subtle">
              You lose access to {actions.project.name} right away. An admin can
              invite you back.
            </span>
          </span>
          <Button
            variant="outline"
            onClick={() => actions.setConfirmLeave(true)}
            className="shrink-0 border-danger-line text-danger-text hover:border-danger-line hover:bg-danger-soft hover:text-danger-text"
          >
            Leave board
          </Button>
        </div>
      )}

      <LeaveBoardDialog
        open={actions.confirmLeave}
        onOpenChange={actions.setConfirmLeave}
        boardName={actions.project?.name ?? 'this board'}
        loading={actions.busy}
        onConfirm={actions.leave}
      />
      <ConfirmDialog
        open={actions.confirmTransfer}
        onOpenChange={actions.setConfirmTransfer}
        variant="warning"
        title={`Make ${heirName} the owner?`}
        description="They can delete the board and manage everyone on it. You stay on it as an admin."
        primaryLabel={actions.busy ? 'Transferring…' : 'Transfer'}
        onConfirm={actions.transfer}
        loading={actions.busy}
      />
    </div>
  );
};

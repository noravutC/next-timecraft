'use client';

import { UserX } from 'lucide-react';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkspaceLogo } from '@/components/workspace/workspace-logo';
import { ownedItemMeta } from '@/helper/utils/account-deletion';
import { OwnedItemRow } from './owned-item-row';
import { useDeleteAccount } from './use-delete-account';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Choose what happens to what you own, type your email, delete. */
export const DeleteAccountDialog = ({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) => {
  const del = useDeleteAccount(open);
  const { plan } = del;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] sm:max-w-130"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4.5 overflow-y-auto p-6">
          <span className="grid size-9 place-items-center rounded-lg bg-danger-soft text-danger-text">
            <UserX className="size-4.5" />
          </span>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-lg font-semibold tracking-tight text-ink">
              Delete your account?
            </DialogTitle>
            <DialogDescription className="text-base leading-5.5 text-ink-muted">
              You’ll be signed out everywhere and removed from every board.
              Comments you wrote stay on their tasks, shown as “Former member”.
              This can’t be undone.
            </DialogDescription>
          </div>

          {!plan && <Skeleton className="h-14 w-full rounded-popover" />}

          {plan?.workspace && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">
                Workspace you own
              </span>
              <div className="flex flex-col rounded-popover border border-line">
                <OwnedItemRow
                  first
                  tile={
                    <WorkspaceLogo
                      workspace={plan.workspace}
                      size="size-6.5"
                      rounded="rounded-md"
                      textSize="text-xs"
                    />
                  }
                  name={plan.workspace.name}
                  meta={ownedItemMeta(
                    plan.workspace,
                    del.choices.workspace ?? 'delete',
                    'workspace',
                  )}
                  heirName={plan.workspace.heir?.name ?? null}
                  choice={del.choices.workspace ?? 'delete'}
                  onChoose={del.chooseWorkspace}
                />
              </div>
            </div>
          )}

          {plan && plan.boards.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">
                Boards you own
              </span>
              <div className="flex flex-col rounded-popover border border-line">
                {plan.boards.map((board, index) => (
                  <OwnedItemRow
                    key={board.id}
                    first={index === 0}
                    tile={
                      <ProjectAvatar
                        project={board}
                        size="size-6.5"
                        rounded="rounded-md"
                        textSize="text-xs"
                      />
                    }
                    name={board.name}
                    meta={ownedItemMeta(
                      board,
                      del.choices.boards[board.id] ?? 'delete',
                      'board',
                    )}
                    heirName={board.heir?.name ?? null}
                    choice={del.choices.boards[board.id] ?? 'delete'}
                    onChoose={(choice) => del.chooseBoard(board.id, choice)}
                  />
                ))}
              </div>
              <span className="text-xs leading-4.25 text-ink-subtle">
                Boards you only joined aren’t affected. Their owners keep them.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="da-confirm"
              className="text-sm leading-5 text-ink-muted"
            >
              Type{' '}
              <span className="rounded-sm border border-line bg-surface-hover px-1.25 py-px font-mono text-xs text-ink">
                {del.email}
              </span>{' '}
              to confirm
            </label>
            <Input
              id="da-confirm"
              type="email"
              autoComplete="off"
              inputSize="lg"
              value={del.phrase}
              onChange={(e) => del.setPhrase(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={del.deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!plan || !del.matches || del.deleting}
            onClick={() => void del.confirm()}
          >
            {del.deleting ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

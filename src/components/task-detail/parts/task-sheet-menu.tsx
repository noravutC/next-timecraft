'use client';

import {
  Archive,
  ArrowRight,
  Copy,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TaskActions } from '../use-task-actions';

/** ⋯ in the task sheet: duplicate, move to another board, archive, delete. */
export const TaskSheetMenu = ({ actions }: { actions: TaskActions }) => {
  const { can } = actions;
  if (!can.duplicate && !can.move && !can.archive && !can.delete) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More task actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-58">
          {can.duplicate && (
            <DropdownMenuItem onSelect={() => void actions.duplicate()}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
          )}
          {can.move && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2.5">
                <ArrowRight className="size-3.75 text-ink-subtle" />
                Move to another board
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-58">
                <DropdownMenuLabel className="font-mono text-xs font-normal text-ink-subtle">
                  Move to
                </DropdownMenuLabel>
                {actions.targets.map((board) => (
                  <DropdownMenuItem
                    key={board.id}
                    onSelect={() => void actions.moveTo(board)}
                  >
                    <ProjectAvatar
                      project={board}
                      size="size-4.5"
                      rounded="rounded-sm"
                      textSize="text-3xs"
                    />
                    <span className="truncate">{board.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <p className="px-2 py-1.5 text-xs leading-4.25 text-ink-subtle">
                  Labels that don’t exist there are dropped. Comments and
                  subtasks come along.
                </p>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {can.archive && (
            <DropdownMenuItem onSelect={actions.archive}>
              <Archive />
              Archive task
            </DropdownMenuItem>
          )}
          {can.delete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => actions.setConfirmDelete(true)}
              >
                <Trash2 />
                Delete permanently
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={actions.confirmDelete}
        onOpenChange={actions.setConfirmDelete}
        variant="destructive"
        title="Delete this task permanently?"
        description="It goes with its comments, subtasks and history. This can’t be undone. To keep it out of the way instead, archive it."
        primaryLabel="Delete task"
        onConfirm={actions.remove}
      />
    </>
  );
};

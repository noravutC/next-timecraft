'use client';

import { Check, ChevronDown, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BOARD_ROLE_HINTS, ROLE_LABELS } from '@/lib/rbac/role-labels';
import type { InvitableRole, ProjectRole } from '@/types';

interface BoardRoleMenuProps {
  name: string;
  role: ProjectRole;
  /** roles you may give: only those below your own */
  options: InvitableRole[];
  onChange: (role: InvitableRole) => void;
  onRemove: () => void;
}

/** A member's role on the board: pick another, or remove them. */
export const BoardRoleMenu = ({
  name,
  role,
  options,
  onChange,
  onRemove,
}: BoardRoleMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        type="button"
        variant="outline"
        aria-label={`Role for ${name}: ${ROLE_LABELS[role]}`}
        className="h-7.5 gap-1.5 pr-2 pl-2.5 font-normal data-[state=open]:border-ink"
      >
        {ROLE_LABELS[role]}
        <ChevronDown className="size-3.5 text-ink-subtle" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-70">
      {options.map((option) => (
        <DropdownMenuItem
          key={option}
          onClick={() => option !== role && onChange(option)}
          className="h-auto items-start gap-2 py-2"
        >
          <span className="mt-0.5 flex size-3.5 shrink-0">
            {option === role && <Check className="size-3.5 text-ink" />}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-ink">
              {ROLE_LABELS[option]}
            </span>
            <span className="text-xs leading-4 text-ink-subtle">
              {BOARD_ROLE_HINTS[option]}
            </span>
          </span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        onClick={onRemove}
        className="gap-2"
      >
        <UserMinus className="size-3.5" />
        Remove from board
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

'use client';

import { Link2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  invitationExpiryLabel,
  inviteeInitials,
} from '@/helper/utils/invitation-status';
import type { PendingInvitation } from '@/types';

/** A pending invitation: dashed avatar, address, role and expiry, actions. */
export const InvitationRow = ({
  invitation,
  bordered,
  onCopyLink,
  onRevoke,
}: {
  invitation: PendingInvitation;
  bordered: boolean;
  onCopyLink: () => void;
  onRevoke: () => void;
}) => (
  <li
    className={cn(
      'flex h-14 items-center gap-3 pr-2 pl-3.5',
      bordered && 'border-t border-line-soft',
    )}
  >
    <span className="grid size-7.5 shrink-0 place-items-center rounded-full border border-dashed border-line-strong text-2xs font-semibold text-ink-subtle">
      {inviteeInitials(invitation.email)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-base text-ink">{invitation.email}</span>
      <span className="truncate text-xs leading-5 text-ink-subtle">
        Invited as {ROLE_LABELS[invitation.role]} ·{' '}
        {invitationExpiryLabel(invitation.expiresAt)}
      </span>
    </span>
    <Badge variant="warning">Pending</Badge>
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onCopyLink}
      aria-label={`Copy invite link for ${invitation.email}`}
      className="size-7.5 text-ink-subtle"
    >
      <Link2 className="size-3.75" />
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onRevoke}
      aria-label={`Revoke invitation for ${invitation.email}`}
      className="size-7.5 text-ink-subtle hover:bg-danger-soft hover:text-danger-text"
    >
      <X className="size-3.75" />
    </Button>
  </li>
);

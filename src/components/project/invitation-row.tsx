'use client';

import { Link2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { inviteeInitials } from '@/helper/utils/invitation-status';

/**
 * A pending invitation, to a board or a workspace: dashed avatar, address,
 * a line about role and expiry, then send again, copy link, revoke.
 */
export const InvitationRow = ({
  email,
  meta,
  bordered,
  onResend,
  onCopyLink,
  onRevoke,
}: {
  email: string;
  /** "Invited as Editor · expires in 6 days" */
  meta: string;
  bordered: boolean;
  onResend?: () => void;
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
      {inviteeInitials(email)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-base text-ink">{email}</span>
      <span className="truncate text-xs leading-5 text-ink-subtle">{meta}</span>
    </span>
    <Badge variant="warning">Pending</Badge>
    {onResend && (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={onResend}
        className="h-7.5 text-ink"
      >
        Resend
      </Button>
    )}
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onCopyLink}
      aria-label={`Copy invite link for ${email}`}
      className="size-7.5 text-ink-subtle"
    >
      <Link2 className="size-3.75" />
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onRevoke}
      aria-label={`Revoke invitation for ${email}`}
      className="size-7.5 text-ink-subtle hover:bg-danger-soft hover:text-danger-text"
    >
      <X className="size-3.75" />
    </Button>
  </li>
);

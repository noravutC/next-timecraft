'use client';

import { useRef } from 'react';
import { Check, ChevronDown, Mail } from 'lucide-react';
import { INVITABLE_ROLES, ROLE_LABELS } from '@/lib/rbac/role-labels';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InvitableRole } from '@/types';

/** "Invite by email": address, role and the Invite button on one row. */
export const InviteForm = ({
  email,
  onEmailChange,
  role,
  onRoleChange,
  error,
  inviting,
  onInvite,
}: {
  email: string;
  onEmailChange: (email: string) => void;
  role: InvitableRole;
  onRoleChange: (role: InvitableRole) => void;
  /** shown under the row after an invalid submit */
  error: string | null;
  inviting: boolean;
  onInvite: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // ช่องว่างแล้วกด Invite → พาไปที่ช่องอีเมลแทนการเงียบ
  const submit = () => (email.trim() ? onInvite() : inputRef.current?.focus());

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="invite-email" className="leading-5">
        Invite by email
      </Label>
      {/* phones: address on its own line, role + Invite below */}
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <div className="relative w-full min-w-0 sm:w-auto sm:flex-1">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.75 -translate-y-1/2 text-ink-subtle" />
          <Input
            ref={inputRef}
            id="invite-email"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'invite-email-error' : undefined}
            type="email"
            inputSize="md"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="name@company.com"
            className="pl-8.5"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={inviting}>
            <Button
              type="button"
              variant="outline"
              aria-label="Role for new member"
              className="h-9 flex-1 justify-between gap-1.5 pr-2.5 pl-3 font-normal sm:flex-none sm:justify-center"
            >
              {ROLE_LABELS[role]}
              <ChevronDown className="size-3.5 text-ink-subtle" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {INVITABLE_ROLES.map((r) => (
              <DropdownMenuItem key={r} onClick={() => onRoleChange(r)}>
                <span className="flex-1">{ROLE_LABELS[r]}</span>
                {r === role && <Check className="size-3.5 text-ink" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          onClick={submit}
          disabled={inviting}
          className="h-9"
        >
          {inviting ? 'Inviting…' : 'Invite'}
        </Button>
      </div>
      {error && (
        <p id="invite-email-error" className="text-xs text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
};

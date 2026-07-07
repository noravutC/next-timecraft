'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check, ChevronDown, Link2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore, useUserStore } from '@/store';
import { can } from '@/lib/rbac/can';
import { INVITABLE_ROLES, ROLE_LABELS } from '@/lib/rbac/role-labels';
import type { InvitableRole } from '@/types';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const InviteMemberDialog = ({
  open,
  onClose,
}: InviteMemberDialogProps) => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;

  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const projects = useProjectStore((s) => s.projects);
  const inviteMember = useProjectStore((s) => s.inviteMember);
  const users = useUserStore((s) => s.users);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitableRole>('editor');
  const [inviting, setInviting] = useState(false);

  // เปิดใหม่ทุกครั้งเคลียร์ฟอร์ม (pattern เดียวกับ BoardSettingsDialog)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setEmail('');
      setRole('editor');
      setInviting(false);
    }
  }

  const project = projectIsUsing ? projects[projectIsUsing] : null;
  if (!project) return null;

  const myRole = project.members.find((m) => m.userId === currentUserId)?.role;
  const canInvite = myRole ? can(myRole, 'member:invite') : false;
  const emailValid = EMAIL_PATTERN.test(email.trim());

  const handleInvite = async () => {
    if (!emailValid || inviting) return;
    setInviting(true);
    try {
      await inviteMember(project.id, { email: email.trim(), role });
      toast.success('Member invited');
      setEmail('');
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ?? 'Unable to invite member',
      );
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Board link copied');
    } catch {
      toast.error('Unable to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] flex-col gap-0 rounded-2xl p-0 sm:max-w-lg"
      >
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4 text-left">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
            <UserPlus className="size-5 text-brand" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-semibold text-ink">
              Invite to {project.name}
            </DialogTitle>
            <DialogDescription className="truncate text-sm text-ink-subtle">
              Collaborators can view and edit this board
            </DialogDescription>
          </div>
          <DialogClose className="ml-auto flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-ink-muted transition-colors hover:bg-surface-active hover:text-ink">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="scrollbar-thin-y scrollbar-light min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {canInvite && (
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold text-ink">
                Invite by email
              </p>
              <div className="flex gap-2">
                <Input
                  inputSize="lg"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleInvite();
                    }
                  }}
                  placeholder="name@company.com"
                  className="min-w-0 flex-1 rounded-lg border-line bg-surface text-sm shadow-none placeholder:text-ink-faint focus-visible:bg-white"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={inviting}>
                    <button
                      type="button"
                      className="flex h-10 w-28 shrink-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:border-brand-line disabled:cursor-default disabled:opacity-50 data-[state=open]:border-brand-line"
                    >
                      <span className="truncate">{ROLE_LABELS[role]}</span>
                      <ChevronDown className="size-4 shrink-0 text-ink-faint" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-(--radix-dropdown-menu-trigger-width)"
                  >
                    {INVITABLE_ROLES.map((r) => (
                      <DropdownMenuItem
                        key={r}
                        onClick={() => setRole(r)}
                        className="justify-between gap-2"
                      >
                        <span>{ROLE_LABELS[r]}</span>
                        {r === role && (
                          <Check className="size-4 shrink-0 text-brand" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => void handleInvite()}
                  disabled={!emailValid || inviting}
                  className="h-10 shrink-0 rounded-lg bg-brand px-4 hover:bg-brand-dark"
                >
                  {inviting ? 'Inviting…' : 'Invite'}
                </Button>
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-ink-subtle uppercase">
              {project.members.length} members
            </p>
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              <Link2 className="size-3.5" />
              Copy invite link
            </button>
          </div>

          <div className="flex flex-col">
            {project.members.map((member) => {
              const user = users[member.userId];
              const initials = user?.fullName?.slice(0, 2).toUpperCase() ?? '?';
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 py-2.5"
                >
                  <Avatar className="size-8.5">
                    <AvatarImage
                      src={user?.avatar ?? undefined}
                      alt={user?.fullName}
                    />
                    <AvatarFallback className="text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user?.fullName ?? '…'}
                    </p>
                    <p className="truncate text-xs text-ink-subtle">
                      {user?.email}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-ink-subtle">
                    {ROLE_LABELS[member.role]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

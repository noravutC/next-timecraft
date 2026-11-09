'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { parseEmailList } from '@/helper/utils/email-list';
import { WORKSPACE_ROLE_LABELS } from '@/lib/rbac/role-labels';
import type { WorkspaceInvitableRole } from '@/lib/rbac/workspace-permissions';

interface WorkspaceInviteFormProps {
  workspaceName: string;
  sending: boolean;
  onInvite: (
    emails: string[],
    role: WorkspaceInvitableRole,
  ) => Promise<boolean>;
}

/** One or more addresses, a role, Send invite. */
export const WorkspaceInviteForm = ({
  workspaceName,
  sending,
  onInvite,
}: WorkspaceInviteFormProps) => {
  const [raw, setRaw] = useState('');
  const [role, setRole] = useState<WorkspaceInvitableRole>('member');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const { emails, invalid } = parseEmailList(raw);
    if (invalid.length > 0 || emails.length === 0) {
      setError(
        invalid.length > 0
          ? `Not an email address: ${invalid.join(', ')}`
          : 'Type an email address',
      );
      return;
    }
    setError(null);
    if (await onInvite(emails, role)) setRaw('');
  };

  return (
    <section aria-labelledby="wm-invite" className="flex flex-col gap-2">
      <Label id="wm-invite" htmlFor="wm-emails" className="leading-5">
        Invite to the workspace
      </Label>
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <div className="relative w-full min-w-0 sm:w-auto sm:flex-1">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.75 -translate-y-1/2 text-ink-subtle" />
          <Input
            id="wm-emails"
            inputSize="md"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void submit();
              }
            }}
            aria-invalid={error ? true : undefined}
            placeholder="name@company.com, separate several with commas"
            className="pl-8.5"
          />
        </div>
        <SegmentedControl
          aria-label="Role for the people you invite"
          value={role}
          onChange={setRole}
          options={[
            { value: 'member', label: WORKSPACE_ROLE_LABELS.member },
            { value: 'admin', label: WORKSPACE_ROLE_LABELS.admin },
          ]}
          className="h-9 items-center"
          optionClassName="h-8"
        />
        <Button
          onClick={() => void submit()}
          disabled={sending}
          className="h-9"
        >
          {sending ? 'Sending…' : 'Send invite'}
        </Button>
      </div>
      <span
        className={
          error ? 'text-xs text-danger-text' : 'text-xs text-ink-subtle'
        }
      >
        {error ??
          (role === 'admin'
            ? 'Admins can also create boards, invite people, change roles and edit workspace settings.'
            : `They’ll get an email with a link to join ${workspaceName}.`)}
      </span>
    </section>
  );
};

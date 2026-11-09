'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimeZonePicker } from '@/components/workspace/time-zone-picker';
import type { OrganizationCache } from '@/types';
import { useWorkspaceForm } from './use-workspace-form';
import { WorkspaceLogoField } from './workspace-logo-field';

interface WorkspaceDetailsFormProps {
  workspace: OrganizationCache;
  canEdit: boolean;
}

/** Logo, name and time zone; read-only for members. */
export const WorkspaceDetailsForm = ({
  workspace,
  canEdit,
}: WorkspaceDetailsFormProps) => {
  const form = useWorkspaceForm(workspace);

  return (
    <section
      aria-label="Workspace details"
      className="flex flex-col gap-5.5 border-b border-line pb-7"
    >
      {!canEdit && (
        <p className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-muted">
          <Lock className="size-3.75 shrink-0 text-ink-subtle" />
          Only the workspace’s owner and admins can change these settings.
        </p>
      )}

      <WorkspaceLogoField
        name={form.name || workspace.name}
        logo={form.logo.logo}
        onPick={(file) => void form.logo.pick(file)}
        onRemove={form.logo.clear}
        disabled={!canEdit}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="ws-name">Workspace name</Label>
        <Input
          id="ws-name"
          inputSize="lg"
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          disabled={!canEdit}
          maxLength={100}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Time zone</span>
        <TimeZonePicker
          value={form.timeZone}
          onChange={form.setTimeZone}
          disabled={!canEdit}
        />
        <span className="text-xs text-ink-subtle">
          Used for due-date reminders.
        </span>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <Button
            disabled={!form.dirty || form.saving}
            onClick={() => void form.save()}
          >
            {form.saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}
    </section>
  );
};

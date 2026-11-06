'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useWorkspaceLogoPicker } from '@/components/workspace/use-workspace-logo-picker';
import { useOrganizationStore } from '@/store/use-organization.store';
import type { OrganizationCache } from '@/types';

/** Name, logo and time zone of the workspace, saved together. */
export function useWorkspaceForm(workspace: OrganizationCache) {
  const updateOrganization = useOrganizationStore((s) => s.updateOrganization);
  const logo = useWorkspaceLogoPicker(workspace.logo);
  const [name, setName] = useState(workspace.name);
  const [timeZone, setTimeZone] = useState(workspace.timeZone);
  const [saving, setSaving] = useState(false);

  const dirty =
    name.trim().length > 0 &&
    (name.trim() !== workspace.name ||
      logo.logo !== workspace.logo ||
      timeZone !== workspace.timeZone);

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await updateOrganization(workspace.id, {
        name: name.trim(),
        logo: logo.logo,
        timeZone,
      });
      toast.success('Workspace saved');
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ??
          'Couldn’t save the workspace',
      );
    } finally {
      setSaving(false);
    }
  };

  return { logo, name, setName, timeZone, setTimeZone, dirty, saving, save };
}

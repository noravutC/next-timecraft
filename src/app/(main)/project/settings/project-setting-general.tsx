'use client';

import { useEffect, useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  SettingsActionBar,
  SettingsCard,
  withToastSave,
} from './settings-action-bar';

interface GeneralSettingsSectionProps {
  projectId: string;
  initialName: string;
  initialDescription: string;
  initialArchived: boolean;
  saving: boolean;
  onSave: (
    projectId: string,
    payload: { name?: string; description?: string; archived?: boolean },
  ) => Promise<void>;
}

export const GeneralSettingsSection = ({
  projectId,
  initialName,
  initialDescription,
  initialArchived,
  onSave,
  saving,
}: GeneralSettingsSectionProps) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [archived, setArchived] = useState(initialArchived);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
    setArchived(initialArchived);
  }, [initialName, initialDescription, initialArchived]);

  const hasChanges =
    name.trim() !== initialName ||
    description.trim() !== initialDescription ||
    archived !== initialArchived;

  const handleSave = () =>
    withToastSave(
      async () => {
        const trimmedName = name.trim();
        if (!trimmedName) throw new Error('Project name is required');
        await onSave(projectId, {
          name: trimmedName,
          description: description.trim(),
          archived,
        });
      },
      'General settings updated',
      'Unable to update general settings',
    );

  const handleReset = () => {
    setName(initialName);
    setDescription(initialDescription);
    setArchived(initialArchived);
  };

  return (
    <div className="space-y-6">
      <SettingsActionBar
        changed={hasChanges}
        saving={saving}
        onReset={handleReset}
        onSave={handleSave}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <SettingsCard>
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="text-base">Project identity</CardTitle>
            <CardDescription>
              Keep the board name and description clear enough that teammates
              understand its scope at a glance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                inputSize="md"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Launch planning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarize what this board is tracking and who it is for."
                className="min-h-32 resize-none"
              />
            </div>
          </CardContent>
        </SettingsCard>

        <SettingsCard>
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="text-base">Workspace state</CardTitle>
            <CardDescription>
              Pause activity without deleting the board structure or history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-background px-4 py-4">
              <Checkbox
                checked={archived}
                onCheckedChange={(checked) => setArchived(Boolean(checked))}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Archive this project
                </p>
                <p className="text-sm text-muted-foreground">
                  Archived projects stay available for reference, but signal to
                  the team that active work has paused.
                </p>
              </div>
            </label>

            <div className="rounded-2xl border border-dashed bg-background px-4 py-4 text-sm text-muted-foreground">
              Visibility is currently shared across the workspace.
            </div>
          </CardContent>
        </SettingsCard>
      </div>
    </div>
  );
};

'use client';

import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ProjectAvatar } from '@/components/project/project-avatar';
import type { ProjectSettings } from '@/types/project-settings';
import type { BoardSettingsDraft } from '../use-board-settings-draft';
import { BoardColorSwatches } from './board-color-swatches';

/** General tab: tile + name, color, description, private toggle. */
export const SettingsGeneralTab = ({
  draft,
  coverImage,
  onNameChange,
  onDescriptionChange,
  onSettingsChange,
}: {
  draft: BoardSettingsDraft;
  coverImage: string | null;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onSettingsChange: (next: Partial<ProjectSettings>) => void;
}) => (
  <div className="flex flex-col gap-5.5">
    <div className="flex items-end gap-4">
      <ProjectAvatar
        project={{
          name: draft.name,
          coverImage,
          settings: draft.settings,
        }}
        size="size-14"
        rounded="rounded-xl"
        textSize="text-xl tracking-tight"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Label htmlFor="board-settings-name" className="leading-5">
          Board name
        </Label>
        <Input
          id="board-settings-name"
          inputSize="lg"
          value={draft.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Q4 Launch Plan"
        />
      </div>
    </div>

    <BoardColorSwatches
      value={draft.settings.color}
      onChange={(color) => onSettingsChange({ color })}
    />

    <div className="flex flex-col gap-2">
      <Label htmlFor="board-settings-description" className="leading-5">
        Description
      </Label>
      <Textarea
        id="board-settings-description"
        rows={3}
        value={draft.description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="What is this board tracking?"
        className="field-sizing-fixed min-h-0 resize-none px-3 py-2.5"
      />
    </div>

    <label className="flex cursor-pointer items-center gap-4 rounded-popover border border-line px-4 py-3.5">
      <Lock className="size-4 shrink-0 text-ink-subtle" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-medium text-ink">Private board</span>
        <span className="text-sm leading-5 text-ink-subtle">
          Only invited members can see this board.
        </span>
      </span>
      <Switch
        aria-label="Private board"
        checked={draft.settings.isPrivate}
        onCheckedChange={(isPrivate) => onSettingsChange({ isPrivate })}
      />
    </label>
  </div>
);

'use client';

import { ChangeEvent, KeyboardEvent, useState } from 'react';
import { Check, Layers, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProjectSettings } from '@/types/project-settings';
import { ICON_OPTIONS, ACCENT_COLORS } from '../_lib/constants';
import { FieldLabel, SectionCard, SettingSwitch } from './section-card';

interface GeneralSectionProps {
  projectName: string;
  projectDescription: string;
  settings: Required<ProjectSettings>;
  updateSettings: (next: Partial<ProjectSettings>) => void;
  commitName: (value: string) => void;
  commitDescription: (value: string) => void;
}

export const GeneralSection = ({
  projectName,
  projectDescription,
  settings,
  updateSettings,
  commitName,
  commitDescription,
}: GeneralSectionProps) => {
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState(projectDescription);

  const persistName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(projectName);
      return;
    }
    if (trimmed === projectName) return;
    commitName(trimmed);
  };

  const persistDescription = () => {
    const trimmed = description.trim();
    if (trimmed === projectDescription) return;
    commitDescription(trimmed);
  };

  return (
    <SectionCard
      icon={Layers}
      title="General"
      hint="Name, description, icon and color"
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <FieldLabel>Board name</FieldLabel>
          <Input
            inputSize="sm"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            onBlur={persistName}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            placeholder="GuardianFlow"
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Description</FieldLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={persistDescription}
            placeholder="What is this board tracking?"
            className="min-h-[72px] resize-none text-sm leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Icon</FieldLabel>
          <div className="grid grid-cols-7 gap-1.5">
            {ICON_OPTIONS.map((option) => {
              const isActive = settings.icon === option.id;
              return (
                <Tooltip key={option.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => updateSettings({ icon: option.id })}
                      aria-label={option.label}
                      aria-pressed={isActive}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-lg border bg-background text-lg transition-all duration-150 hover:scale-105',
                        isActive
                          ? 'border-foreground shadow-sm ring-2 ring-foreground/10'
                          : 'border-border hover:border-foreground/30',
                      )}
                    >
                      <span aria-hidden="true">{option.emoji}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{option.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Color</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((option) => {
              const isActive = settings.color === option.value;
              return (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => updateSettings({ color: option.value })}
                      aria-label={option.label}
                      aria-pressed={isActive}
                      className={cn(
                        'relative flex size-7 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110',
                        isActive &&
                          'ring-2 ring-foreground ring-offset-2 ring-offset-card',
                      )}
                      style={{ backgroundColor: option.value }}
                    >
                      {isActive && (
                        <Check
                          className="size-4 text-white drop-shadow-sm"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{option.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t pt-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
            <Lock className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">Private board</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Only invited members
            </p>
          </div>
          <SettingSwitch
            checked={settings.isPrivate}
            onChange={(v) => updateSettings({ isPrivate: v })}
            label="Private board"
          />
        </div>
      </div>
    </SectionCard>
  );
};

'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  SettingsActionBar,
  SettingsCard,
  withToastSave,
} from './settings-action-bar';

// ─── Cover presets ───────────────────────────────────────────────────────────

function buildCoverPreset(from: string, to: string, label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 280">
      <defs>
        <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="480" height="280" rx="36" fill="url(#g)" />
      <circle cx="400" cy="60" r="72" fill="rgba(255,255,255,0.18)" />
      <circle cx="70" cy="220" r="94" fill="rgba(255,255,255,0.1)" />
      <text x="40" y="238" fill="white" font-size="72" font-family="Arial, sans-serif" font-weight="700">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const coverPresets = [
  buildCoverPreset('#2563eb', '#38bdf8', 'TC'),
  buildCoverPreset('#f97316', '#fb7185', 'PM'),
  buildCoverPreset('#0f766e', '#2dd4bf', 'WK'),
  buildCoverPreset('#7c3aed', '#c084fc', 'PX'),
];

// ─── Component ───────────────────────────────────────────────────────────────

interface AppearanceSettingsSectionProps {
  projectId: string;
  projectName: string;
  initialCoverImage: string;
  saving: boolean;
  onSave: (
    projectId: string,
    payload: { coverImage?: string | null },
  ) => Promise<void>;
}

export const AppearanceSettingsSection = ({
  projectId,
  projectName,
  initialCoverImage,
  onSave,
  saving,
}: AppearanceSettingsSectionProps) => {
  const [coverImage, setCoverImage] = useState(initialCoverImage);

  useEffect(() => {
    setCoverImage(initialCoverImage);
  }, [initialCoverImage]);

  const hasChanges = coverImage.trim() !== initialCoverImage;

  const handleSave = () =>
    withToastSave(
      async () => {
        const next = coverImage.trim();
        await onSave(projectId, { coverImage: next || null });
      },
      'Appearance updated',
      'Unable to update appearance',
    );

  return (
    <div className="space-y-6">
      <SettingsActionBar
        changed={hasChanges}
        saving={saving}
        onReset={() => setCoverImage(initialCoverImage)}
        onSave={handleSave}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SettingsCard>
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="text-base">Project cover</CardTitle>
            <CardDescription>
              Use a memorable cover so the board is easier to recognize in the
              workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-5 pb-5">
            <div className="space-y-2">
              <Label htmlFor="project-cover-image">Cover image URL</Label>
              <Input
                id="project-cover-image"
                inputSize="md"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Paste an image URL or pick one of the quick presets below.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Quick presets</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {coverPresets.map((preset, index) => {
                  const isActive = coverImage.trim() === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      className={cn(
                        'group relative overflow-hidden rounded-2xl border transition-all',
                        isActive
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/30',
                      )}
                      onClick={() => setCoverImage(preset)}
                    >
                      <div
                        className="h-20 w-full bg-cover bg-center"
                        style={{ backgroundImage: `url("${preset}")` }}
                      />
                      <div className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="font-medium text-foreground">
                          Preset {index + 1}
                        </span>
                        {isActive && <Check className="size-4 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </SettingsCard>

        {/* Preview card intentionally uses a dark theme — different from SettingsCard */}
        <div className="rounded-xl border border-white/70 bg-slate-950 text-white shadow-sm">
          <div className="px-5 pt-5 pb-0">
            <p className="text-base font-semibold text-white">Preview</p>
            <p className="mt-1 text-sm text-slate-300">
              This is how the board identity will look in the interface.
            </p>
          </div>
          <div className="space-y-4 px-5 pb-5 pt-4">
            <div
              className="relative h-44 overflow-hidden rounded-3xl border border-white/10 bg-slate-900 bg-cover bg-center"
              style={
                coverImage.trim()
                  ? { backgroundImage: `url("${coverImage.trim()}")` }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute right-4 bottom-4 left-4">
                <p className="text-xs tracking-[0.18em] text-slate-300 uppercase">
                  Timecraft project
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {projectName}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
              If no image is provided, the project falls back to a clean icon
              avatar in the header and switcher.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

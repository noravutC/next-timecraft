'use client';

import React, { useState } from 'react';
import { ChevronRight, Palette, Settings, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavStore, useProjectStore } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GeneralSettingsSection } from './project-setting-general';
import { AppearanceSettingsSection } from './project-setting-appearance';
import { TagsSettingsSection } from './project-setting-tags';

// ─── Nav config ──────────────────────────────────────────────────────────────

type SettingsPanelTab = 'general' | 'appearance' | 'tags';

const navItems: {
  key: SettingsPanelTab;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    key: 'general',
    label: 'General',
    icon: Settings,
    description: 'Name, description, and basic visibility',
  },
  {
    key: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Project cover and visual identity',
  },
  {
    key: 'tags',
    label: 'Tags',
    icon: Tag,
    description: 'Labels used across your board',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const ProjectSettingsPanel = () => {
  const { projectIsUsing, projects, status, updateProject } = useProjectStore();
  const { setView } = useNavStore();
  const [activeTab, setActiveTab] = useState<SettingsPanelTab>('general');

  const project = projectIsUsing ? projects[projectIsUsing] : null;
  const activeItem = navItems.find((item) => item.key === activeTab);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Card className="w-full max-w-md border-dashed">
          <CardHeader>
            <CardTitle>No project selected</CardTitle>
            <CardDescription>
              Select a project first to edit its settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setView('board')}>Back to board</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saving = status === 'updating';

  const sectionContent = {
    general: (
      <GeneralSettingsSection
        key={project.id}
        projectId={project.id}
        initialName={project.name}
        initialDescription={project.description ?? ''}
        initialArchived={Boolean(project.archived)}
        onSave={updateProject}
        saving={saving}
      />
    ),
    appearance: (
      <AppearanceSettingsSection
        key={project.id}
        projectId={project.id}
        projectName={project.name}
        initialCoverImage={project.coverImage ?? ''}
        onSave={updateProject}
        saving={saving}
      />
    ),
    tags: (
      <TagsSettingsSection
        key={project.id}
        projectId={project.id}
        initialTags={project.tags ?? []}
        onSave={updateProject}
        saving={saving}
      />
    ),
  }[activeTab];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(59,130,246,0.08),transparent_24%),linear-gradient(135deg,#ffffff_0%,#f8fbff_52%,#f3f6fb_100%)]">
      {/* Top bar */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-2 px-4 py-4 md:px-6">
        <Button variant="outline" size="sm" onClick={() => setView('board')}>
          Back to board
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setView('board')}
          aria-label="Close settings"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Content grid */}
      <div className="mx-auto grid h-[calc(100vh-13.5rem)] w-full max-w-6xl gap-5 overflow-hidden px-4 pb-24 md:px-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar nav */}
        <aside className="space-y-4">
          <Card className="gap-3 border-white/70 bg-white/90 shadow-sm backdrop-blur">
            <CardHeader className="px-5 pt-5 pb-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Settings</CardTitle>
                  <CardDescription>Choose a section to edit.</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {project.archived ? 'Archived' : 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all',
                      isActive
                        ? 'border-primary/20 bg-primary/[0.08] shadow-sm'
                        : 'border-transparent hover:border-border hover:bg-muted/60',
                    )}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <div
                      className={cn(
                        'flex size-9 items-center justify-center rounded-xl',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <item.icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        'size-4 shrink-0 transition-transform',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        {/* Section content */}
        <main className="min-w-0 overflow-hidden">
          <Card className="flex h-full border-white/70 bg-white/90 shadow-sm backdrop-blur">
            <CardHeader className="gap-3 border-b px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{activeItem?.label}</CardTitle>
                  <CardDescription className="mt-1">
                    {activeItem?.description}
                  </CardDescription>
                </div>
                <p className="text-sm text-muted-foreground">Saved per section</p>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {sectionContent}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

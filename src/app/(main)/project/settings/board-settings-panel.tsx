'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useNavStore, useProjectStore } from '@/store';
import type { Member } from '@/types';
import {
  withSettingsDefaults,
  type ProjectSettings,
} from '@/types/project-settings';
import type { UpdateProjectPayload } from '@/services/projects.service';
import { DangerZoneSection } from './_components/danger-zone-section';
import { GeneralSection } from './_components/general-section';
import { MembersSection } from './_components/members-section';
import { TagsSection } from './_components/tags-section';

export const BoardSettingsPanel = () => {
  const { projectIsUsing, projects } = useProjectStore();
  const { setView } = useNavStore();

  const project = projectIsUsing ? projects[projectIsUsing] : null;

  if (!project) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Select a project to view its settings.
      </div>
    );
  }

  return (
    <BoardSettingsContent
      key={project.id}
      projectId={project.id}
      projectName={project.name}
      projectDescription={project.description ?? ''}
      projectTags={project.tags ?? []}
      projectSettings={project.settings ?? {}}
      projectMembers={project.members ?? []}
      projectOwnerId={project.ownerId}
      projectArchived={project.archived}
      onClose={() => setView('board')}
    />
  );
};

interface ContentProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectTags: string[];
  projectSettings: ProjectSettings;
  projectMembers: Member[];
  projectOwnerId: string;
  projectArchived: boolean;
  onClose: () => void;
}

type Draft = {
  name: string;
  description: string;
  tags: string[];
  settings: Required<ProjectSettings>;
};

const BoardSettingsContent = ({
  projectId,
  projectName,
  projectDescription,
  projectTags,
  projectSettings,
  projectMembers,
  projectOwnerId,
  projectArchived,
  onClose,
}: ContentProps) => {
  const updateProject = useProjectStore((s) => s.updateProject);

  const [draft, setDraft] = useState<Draft>({
    name: projectName,
    description: projectDescription,
    tags: projectTags,
    settings: withSettingsDefaults(projectSettings),
  });

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const dirtyRef = useRef(false);
  const skipFlushRef = useRef(false);

  const markDirty = () => {
    dirtyRef.current = true;
  };

  const updateSettings = (next: Partial<ProjectSettings>) => {
    setDraft((d) => ({ ...d, settings: { ...d.settings, ...next } }));
    markDirty();
  };

  const setTagColor = (tag: string, color: string) => {
    setDraft((d) => ({
      ...d,
      settings: {
        ...d.settings,
        tagColors: { ...d.settings.tagColors, [tag]: color },
      },
    }));
    markDirty();
  };

  const dropTagColor = (tag: string) => {
    setDraft((d) => {
      const next = { ...d.settings.tagColors };
      delete next[tag];
      return { ...d, settings: { ...d.settings, tagColors: next } };
    });
    markDirty();
  };

  const commitName = (value: string) => {
    setDraft((d) => ({ ...d, name: value }));
    markDirty();
  };

  const commitDescription = (value: string) => {
    setDraft((d) => ({ ...d, description: value }));
    markDirty();
  };

  const commitTags = (tags: string[]) => {
    setDraft((d) => ({ ...d, tags }));
    markDirty();
  };

  // Single flush on unmount
  useEffect(() => {
    return () => {
      if (skipFlushRef.current) return;
      if (!dirtyRef.current) return;

      const d = draftRef.current;
      const payload: UpdateProjectPayload = {
        description: d.description.trim(),
        tags: d.tags,
        settings: d.settings,
      };
      const trimmedName = d.name.trim();
      if (trimmedName) payload.name = trimmedName;

      updateProject(projectId, payload).catch(() => {
        toast.error('Unable to save board settings');
      });
    };
  }, [projectId, updateProject]);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-muted/40 [overflow-anchor:none] [scrollbar-color:theme(colors.gray.400)_theme(colors.gray.50)] [scrollbar-width:thin]">
      <div className="flex flex-col gap-4 p-4">
        <GeneralSection
          projectName={projectName}
          projectDescription={projectDescription}
          settings={draft.settings}
          updateSettings={updateSettings}
          commitName={commitName}
          commitDescription={commitDescription}
        />

        <TagsSection
          projectTags={draft.tags}
          settings={draft.settings}
          updateSettings={updateSettings}
          setTagColor={setTagColor}
          dropTagColor={dropTagColor}
          commitTags={commitTags}
        />

        <MembersSection
          members={projectMembers}
          ownerId={projectOwnerId}
          isPrivate={draft.settings.isPrivate}
        />

        <DangerZoneSection
          projectId={projectId}
          projectName={projectName}
          projectArchived={projectArchived}
          onDeleted={() => {
            skipFlushRef.current = true;
            onClose();
          }}
        />
      </div>
    </div>
  );
};

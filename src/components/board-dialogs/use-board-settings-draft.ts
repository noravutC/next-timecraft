import { useState } from 'react';
import { toast } from 'sonner';
import { useProjectStore } from '@/store';
import { useTaskStore } from '@/store/use-task.store';
import { TAG_LIMIT } from '@/lib/project-settings/constants';
import { hashTagColor } from '@/lib/project-settings/tag-palette';
import {
  dropTagRename,
  hasTagRenames,
  recordTagRename,
  type TagRenames,
} from '@/helper/utils/tag-rename';
import {
  withSettingsDefaults,
  type ProjectSettings,
} from '@/types/project-settings';

export type BoardSettingsDraft = {
  name: string;
  description: string;
  tags: string[];
  settings: Required<ProjectSettings>;
};

/**
 * State + handlers ทั้งหมดของ Board settings dialog:
 * snapshot draft ตอนเปิด, แก้ใน draft, กด Save ค่อยยิง API
 */
export function useBoardSettingsDraft({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const projects = useProjectStore((s) => s.projects);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const project = projectIsUsing ? projects[projectIsUsing] : null;

  const [draft, setDraft] = useState<BoardSettingsDraft | null>(null);
  const [draftTag, setDraftTag] = useState('');
  const [renames, setRenames] = useState<TagRenames>({});
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // เปิดใหม่ทุกครั้ง snapshot ค่าโปรเจกต์ปัจจุบันเป็น draft (แก้แล้วกด Save ค่อยยิง)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && project) {
      setDraft({
        name: project.name,
        description: project.description ?? '',
        tags: project.tags ?? [],
        settings: withSettingsDefaults(project.settings),
      });
      setDraftTag('');
      setRenames({});
      setSaving(false);
    }
  }

  const patchSettings = (next: Partial<ProjectSettings>) =>
    setDraft((d) => d && { ...d, settings: { ...d.settings, ...next } });

  // toasts the reason and returns false when the name can't be used
  const acceptTagName = (name: string, except?: string) => {
    const taken = draft?.tags.some(
      (t) => t !== except && t.toLowerCase() === name.toLowerCase(),
    );
    if (taken) toast.error('This tag already exists');
    else if (name.length > TAG_LIMIT)
      toast.error(`Tags must be ${TAG_LIMIT} characters or fewer`);
    return !taken && name.length <= TAG_LIMIT;
  };

  const addTag = () => {
    if (!draft) return;
    const next = draftTag.trim();
    if (!next || !acceptTagName(next)) return;
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        tags: [...d.tags, next],
        settings: {
          ...d.settings,
          tagColors: {
            ...d.settings.tagColors,
            [next]: d.settings.nextTagColor,
          },
        },
      };
    });
    setDraftTag('');
  };

  /** false when the name is refused, so the field stays open */
  const renameTag = (tag: string, name: string) => {
    if (!project) return false;
    const next = name.trim();
    if (!next || next === tag) return true;
    if (!acceptTagName(next, tag)) return false;
    setDraft((d) => {
      if (!d) return d;
      // the color goes with the name, even one it only had by default
      const { [tag]: color, ...tagColors } = d.settings.tagColors;
      return {
        ...d,
        tags: d.tags.map((t) => (t === tag ? next : t)),
        settings: {
          ...d.settings,
          tagColors: { ...tagColors, [next]: color ?? hashTagColor(tag) },
        },
      };
    });
    setRenames((r) => recordTagRename(r, project.tags ?? [], tag, next));
    return true;
  };

  const recolorTag = (tag: string, color: string) =>
    setDraft(
      (d) =>
        d && {
          ...d,
          settings: {
            ...d.settings,
            tagColors: { ...d.settings.tagColors, [tag]: color },
          },
        },
    );

  const removeTag = (tag: string) => {
    setRenames((r) => dropTagRename(r, tag));
    setDraft((d) => {
      if (!d) return d;
      const tagColors = { ...d.settings.tagColors };
      delete tagColors[tag];
      return {
        ...d,
        tags: d.tags.filter((t) => t !== tag),
        settings: { ...d.settings, tagColors },
      };
    });
  };

  const handleSave = async () => {
    if (!project || !draft || saving || !draft.name.trim()) return;
    setSaving(true);
    try {
      await updateProject(project.id, {
        name: draft.name.trim(),
        description: draft.description.trim(),
        tags: draft.tags,
        ...(hasTagRenames(renames) ? { renameTags: renames } : {}),
        settings: draft.settings,
      });
      if (hasTagRenames(renames)) {
        useTaskStore.getState().renameTagsOnBoard(project.id, renames);
      }
      toast.success('Board settings saved');
      onClose();
    } catch {
      toast.error('Unable to save board settings');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!project) return;
    try {
      await updateProject(project.id, { archived: !project.archived });
      toast.success(project.archived ? 'Board unarchived' : 'Board archived');
    } catch {
      toast.error('Unable to update archive state');
    } finally {
      setConfirmArchive(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    setDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success('Board deleted');
      onClose();
    } catch {
      toast.error('Unable to delete board');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return {
    project,
    draft,
    setDraft,
    draftTag,
    setDraftTag,
    saving,
    deleting,
    confirmArchive,
    setConfirmArchive,
    confirmDelete,
    setConfirmDelete,
    patchSettings,
    addTag,
    renameTag,
    recolorTag,
    removeTag,
    handleSave,
    handleArchive,
    handleDelete,
  };
}

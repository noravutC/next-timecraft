import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useProjectStore } from '@/store';
import { useTaskStore } from '@/store/use-task.store';
import { TAG_LIMIT } from '@/lib/project-settings/constants';
import {
  dropTagRename,
  hasTagRenames,
  recordTagRename,
  savedNameOf,
  type TagRenames,
} from '@/helper/utils/tag-rename';
import { projectServices } from '@/services/projects.service';
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
  const [tagCounts, setTagCounts] = useState<Record<string, number> | null>(
    null,
  );
  const projectId = project?.id ?? null;
  useEffect(() => {
    if (!open || !projectId) return;
    let active = true;
    projectServices
      .getTagCounts(projectId)
      .then((counts) => active && setTagCounts(counts))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open, projectId]);
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

  /**
   * A tag's new name and color, from its edit row. False when the name is
   * refused, so the row stays open.
   */
  const saveTag = (tag: string, name: string, color: string) => {
    if (!project) return false;
    const next = name.trim() || tag;
    if (next !== tag && !acceptTagName(next, tag)) return false;
    setDraft((d) => {
      if (!d) return d;
      const { [tag]: _old, ...tagColors } = d.settings.tagColors;
      return {
        ...d,
        tags: d.tags.map((t) => (t === tag ? next : t)),
        settings: {
          ...d.settings,
          tagColors: { ...tagColors, [next]: color },
        },
      };
    });
    if (next !== tag) {
      setRenames((r) => recordTagRename(r, project.tags ?? [], tag, next));
    }
    return true;
  };

  /** Tasks using a tag, counted under the name it was saved with. */
  const tagUses = (tag: string) => {
    const saved = savedNameOf(renames, project?.tags ?? [], tag);
    return saved ? (tagCounts?.[saved] ?? 0) : 0;
  };

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
    saveTag,
    tagUses,
    removeTag,
    handleSave,
    handleArchive,
    handleDelete,
  };
}

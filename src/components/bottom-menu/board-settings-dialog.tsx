'use client';

import { useState } from 'react';
import { Check, Lock, Plus, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/store';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TagChip } from '@/components/task-detail/parts/tag-chip';
import {
  ACCENT_COLORS,
  ICON_OPTIONS,
  TAG_LIMIT,
  TAG_PALETTE,
} from '@/lib/project-settings/constants';
import {
  withSettingsDefaults,
  type ProjectSettings,
} from '@/types/project-settings';

interface BoardSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Draft = {
  name: string;
  description: string;
  tags: string[];
  settings: Required<ProjectSettings>;
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 text-xs font-semibold tracking-wider text-ink-subtle uppercase">
    {children}
  </p>
);

// ขนาด h-[560px]/max-w-2xl ต้องตรงกับ SwitchBoards/CreateBoard dialog —
// ชุด dialog จาก bottom bar ต้องสูงเท่ากันจะได้ไม่กระตุกตอนสลับ
export const BoardSettingsDialog = ({
  open,
  onClose,
}: BoardSettingsDialogProps) => {
  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const projects = useProjectStore((s) => s.projects);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const project = projectIsUsing ? projects[projectIsUsing] : null;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftTag, setDraftTag] = useState('');
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
      setSaving(false);
    }
  }

  if (!project || !draft) return null;

  const patchSettings = (next: Partial<ProjectSettings>) =>
    setDraft((d) => d && { ...d, settings: { ...d.settings, ...next } });

  const iconEmoji =
    ICON_OPTIONS.find((i) => i.id === draft.settings.icon)?.emoji ?? '📁';

  const addTag = () => {
    const next = draftTag.trim();
    if (!next) return;
    if (draft.tags.some((t) => t.toLowerCase() === next.toLowerCase())) {
      toast.error('This tag already exists');
      return;
    }
    if (next.length > TAG_LIMIT) {
      toast.error(`Tags must be ${TAG_LIMIT} characters or fewer`);
      return;
    }
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        tags: [...d.tags, next],
        settings: {
          ...d.settings,
          tagColors: { ...d.settings.tagColors, [next]: d.settings.nextTagColor },
        },
      };
    });
    setDraftTag('');
  };

  const removeTag = (tag: string) => {
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
    if (saving || !draft.name.trim()) return;
    setSaving(true);
    try {
      await updateProject(project.id, {
        name: draft.name.trim(),
        description: draft.description.trim(),
        tags: draft.tags,
        settings: draft.settings,
      });
      toast.success('Board settings saved');
      onClose();
    } catch {
      toast.error('Unable to save board settings');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
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

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[560px] flex-col gap-0 rounded-2xl p-0 sm:max-w-2xl"
        >
          <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
              <Settings2 className="size-5 text-brand" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-ink">
                Board settings
              </DialogTitle>
              <DialogDescription className="truncate text-sm text-ink-subtle">
                {project.name}
              </DialogDescription>
            </div>
            <DialogClose className="ml-auto flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-ink-muted transition-colors hover:bg-surface-active hover:text-ink">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <div className="scrollbar-thin-y scrollbar-light min-h-0 flex-1 overflow-y-auto px-6 py-5 [overflow-anchor:none]">
            <div className="flex items-end gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: `${draft.settings.color}1a` }}
              >
                {iconEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <FieldLabel>Board name</FieldLabel>
                <Input
                  inputSize="lg"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => d && { ...d, name: e.target.value })
                  }
                  placeholder="e.g. GuardianFlow"
                  className="rounded-lg border-line bg-surface text-sm shadow-none placeholder:text-ink-faint focus-visible:bg-white"
                />
              </div>
            </div>

            <div className="mt-5">
              <FieldLabel>Icon</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((option) => {
                  const isActive = draft.settings.icon === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => patchSettings({ icon: option.id })}
                      aria-label={option.label}
                      aria-pressed={isActive}
                      className={cn(
                        'flex size-10 cursor-pointer items-center justify-center rounded-xl border text-lg transition-colors',
                        isActive
                          ? 'border-brand bg-brand-soft/40'
                          : 'border-line bg-white hover:border-brand-line',
                      )}
                    >
                      <span aria-hidden="true">{option.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <FieldLabel>Icon background</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((option) => {
                  const isActive = draft.settings.color === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => patchSettings({ color: option.value })}
                      aria-label={option.label}
                      aria-pressed={isActive}
                      className={cn(
                        'flex size-9 cursor-pointer items-center justify-center rounded-xl border transition-colors',
                        isActive
                          ? 'border-brand'
                          : 'border-line hover:border-brand-line',
                      )}
                      style={{ backgroundColor: `${option.value}1a` }}
                    >
                      {isActive && (
                        <Check
                          className="size-4"
                          style={{ color: option.value }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => d && { ...d, description: e.target.value })
                }
                placeholder="What is this board tracking?"
                rows={3}
                className="rounded-xl border-line text-sm placeholder:text-ink-faint"
              />
            </div>

            <div className="mt-5">
              <FieldLabel>Tags</FieldLabel>
              {draft.tags.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {draft.tags.map((tag) => (
                    <TagChip
                      key={tag}
                      tag={tag}
                      tagColors={draft.settings.tagColors}
                      size="sm"
                      onRemove={() => removeTag(tag)}
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span
                    className="pointer-events-none absolute top-1/2 left-3 size-2 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: draft.settings.nextTagColor }}
                  />
                  <Input
                    inputSize="md"
                    value={draftTag}
                    onChange={(e) => setDraftTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag…"
                    maxLength={TAG_LIMIT}
                    className="rounded-lg border-line bg-surface pl-7 text-sm shadow-none placeholder:text-ink-faint focus-visible:bg-white"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!draftTag.trim()}
                  className="h-9 gap-1 rounded-lg"
                >
                  <Plus className="size-3.5" />
                  Add tag
                </Button>
              </div>
              {/* เลือกสีก่อนสร้าง — จุดสีหน้า input พรีวิวสีที่ tag ใหม่จะได้ */}
              <div className="mt-2.5 flex flex-wrap gap-2">
                {TAG_PALETTE.map((option) => {
                  const isActive =
                    draft.settings.nextTagColor === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        patchSettings({ nextTagColor: option.value })
                      }
                      aria-pressed={isActive}
                      aria-label={`Next tag color ${option.value}`}
                      className={cn(
                        'size-5 cursor-pointer rounded-full transition-transform hover:scale-110',
                        isActive &&
                          'ring-2 ring-brand ring-offset-2 ring-offset-background',
                      )}
                      style={{ backgroundColor: option.value }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-line p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-muted">
                <Lock className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">Private board</p>
                <p className="text-xs text-ink-subtle">
                  Only invited members can see this board
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.settings.isPrivate}
                aria-label="Private board"
                onClick={() =>
                  patchSettings({ isPrivate: !draft.settings.isPrivate })
                }
                className={cn(
                  'h-6 w-10.5 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors',
                  draft.settings.isPrivate ? 'bg-brand' : 'bg-ink-faint/40',
                )}
              >
                <span
                  className={cn(
                    'block size-5 rounded-full bg-white shadow-sm transition-transform',
                    draft.settings.isPrivate && 'translate-x-4.5',
                  )}
                />
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-destructive/25">
              <p className="border-b border-destructive/25 bg-destructive/5 px-4 py-2.5 text-xs font-semibold tracking-wider text-destructive uppercase">
                Danger zone
              </p>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {project.archived ? 'Unarchive board' : 'Archive board'}
                  </p>
                  <p className="text-xs text-ink-subtle">
                    {project.archived
                      ? 'Restore it to your active boards.'
                      : 'Hide it from your active boards. You can restore it later.'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmArchive(true)}
                  className="shrink-0 rounded-lg"
                >
                  {project.archived ? 'Unarchive' : 'Archive'}
                </Button>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-destructive">
                    Delete board
                  </p>
                  <p className="text-xs text-ink-subtle">
                    Permanently remove this board and all its tasks.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="shrink-0 rounded-lg border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving || !draft.name.trim()}
              className="h-9 rounded-lg bg-brand hover:bg-brand-dark"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        variant="warning"
        title={project.archived ? 'Unarchive board?' : 'Archive board?'}
        description={
          project.archived
            ? 'This board will become active again.'
            : 'This board will be hidden from your active boards. You can unarchive it anytime.'
        }
        primaryLabel={project.archived ? 'Unarchive' : 'Archive'}
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title="Delete this board permanently?"
        description={
          <>
            All columns and cards in <strong>{project.name}</strong> will be
            removed. This action cannot be undone.
          </>
        }
        primaryLabel={deleting ? 'Deleting…' : 'Delete board'}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
};

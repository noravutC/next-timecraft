'use client';

import { Check, Lock, Settings2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { ACCENT_COLORS, ICON_OPTIONS } from '@/lib/project-settings/constants';
import { FieldLabel } from './parts/field-label';
import { BoardTagsEditor } from './parts/board-tags-editor';
import { BoardDangerZone } from './parts/board-danger-zone';
import { useBoardSettingsDraft } from './use-board-settings-draft';

interface BoardSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

// ขนาด h-[560px]/max-w-2xl ต้องตรงกับ SwitchBoards/CreateBoard dialog —
// ชุด dialog จาก bottom bar ต้องสูงเท่ากันจะได้ไม่กระตุกตอนสลับ
export const BoardSettingsDialog = ({
  open,
  onClose,
}: BoardSettingsDialogProps) => {
  const {
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
    iconEmoji,
    addTag,
    removeTag,
    handleSave,
    handleArchive,
    handleDelete,
  } = useBoardSettingsDraft({ open, onClose });

  if (!project || !draft) return null;

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

            <BoardTagsEditor
              tags={draft.tags}
              tagColors={draft.settings.tagColors}
              nextTagColor={draft.settings.nextTagColor}
              draftTag={draftTag}
              onDraftTagChange={setDraftTag}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onPickNextColor={(color) =>
                patchSettings({ nextTagColor: color })
              }
            />

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

            <BoardDangerZone
              archived={!!project.archived}
              onArchiveClick={() => setConfirmArchive(true)}
              onDeleteClick={() => setConfirmDelete(true)}
            />
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

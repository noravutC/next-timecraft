'use client';

import { Lock } from 'lucide-react';
import { useNavStore, type BoardSettingsTab } from '@/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersPanel } from '@/components/project/members-panel';
import { SettingsGeneralTab } from './parts/settings-general-tab';
import { BoardTagsEditor } from './parts/board-tags-editor';
import { BoardDangerZone } from './parts/board-danger-zone';
import { useBoardSettingsDraft } from './use-board-settings-draft';
import { useBoardAccess } from '@/components/project/use-board-access';

interface BoardSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const TAB_CONTENT = 'min-h-0 overflow-y-auto p-6';

const ReadOnlySettingsNote = () => (
  <p className="mb-5 flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-muted">
    <Lock className="size-3.75 shrink-0 text-ink-subtle" />
    Only the board’s owner and admins can change these settings.
  </p>
);

/** Board settings: General · Tags · Members · Danger zone. */
export const BoardSettingsDialog = ({
  open,
  onClose,
}: BoardSettingsDialogProps) => {
  const tab = useNavStore((s) => s.settingsTab);
  const setTab = useNavStore((s) => s.setSettingsTab);
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
    addTag,
    removeTag,
    handleSave,
    handleArchive,
    handleDelete,
  } = useBoardSettingsDraft({ open, onClose });
  const access = useBoardAccess(project?.id);

  if (!project || !draft) return null;

  // General กับ Tags แก้เป็น draft แล้วกด Save; Members / Danger zone มีผลทันที
  const showFooter = tab === 'general' || tab === 'tags';
  // editors and viewers see the settings but can't change them
  const canEdit = access.can('project:update');

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="h-155 max-h-[calc(100vh-2rem)] sm:max-w-180">
          <DialogHeader>
            <DialogTitle>Board settings</DialogTitle>
            <DialogDescription className="truncate leading-5">
              {project.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={tab}
            onValueChange={(next) => setTab(next as BoardSettingsTab)}
            className="mt-3 min-h-0 flex-1 gap-0"
          >
            <TabsList variant="underline" className="px-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="tags">
                Tags
                {draft.tags.length > 0 && (
                  <Badge variant="count">{draft.tags.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="members">
                Members
                {project.members.length > 0 && (
                  <Badge variant="count">{project.members.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="danger">Danger zone</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className={TAB_CONTENT}>
              {!canEdit && <ReadOnlySettingsNote />}
              <SettingsGeneralTab
                readOnly={!canEdit}
                draft={draft}
                coverImage={project.coverImage}
                onNameChange={(name) => setDraft((d) => d && { ...d, name })}
                onDescriptionChange={(description) =>
                  setDraft((d) => d && { ...d, description })
                }
                onSettingsChange={patchSettings}
              />
            </TabsContent>
            <TabsContent value="tags" className={TAB_CONTENT}>
              {!canEdit && <ReadOnlySettingsNote />}
              <BoardTagsEditor
                readOnly={!canEdit}
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
            </TabsContent>
            <TabsContent value="members" className={TAB_CONTENT}>
              <MembersPanel />
            </TabsContent>
            <TabsContent value="danger" className={TAB_CONTENT}>
              <BoardDangerZone
                archived={!!project.archived}
                canArchive={canEdit}
                canDelete={access.can('project:delete')}
                onArchiveClick={() => setConfirmArchive(true)}
                onDeleteClick={() => setConfirmDelete(true)}
              />
            </TabsContent>
          </Tabs>

          {showFooter && canEdit && (
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSave()}
                disabled={saving || !draft.name.trim()}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          )}
          {showFooter && !canEdit && (
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        variant="warning"
        title={
          project.archived ? 'Unarchive this board?' : 'Archive this board?'
        }
        description={
          project.archived
            ? 'It will show up in your active boards again.'
            : 'It will be hidden from your active boards. You can unarchive it anytime.'
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
            All columns and cards in{' '}
            <strong className="font-semibold text-ink">{project.name}</strong>{' '}
            will be removed. This action cannot be undone.
          </>
        }
        confirmPhrase={project.name}
        primaryLabel={deleting ? 'Deleting…' : 'Delete board'}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
};

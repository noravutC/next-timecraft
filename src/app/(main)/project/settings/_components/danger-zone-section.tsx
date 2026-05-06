'use client';

import { useState } from 'react';
import { Pencil, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/store';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SectionCard } from './section-card';

interface DangerZoneSectionProps {
  projectId: string;
  projectName: string;
  projectArchived: boolean;
  onDeleted: () => void;
}

export const DangerZoneSection = ({
  projectId,
  projectName,
  projectArchived,
  onDeleted,
}: DangerZoneSectionProps) => {
  const { updateProject, deleteProject } = useProjectStore();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleArchive = async () => {
    try {
      await updateProject(projectId, { archived: !projectArchived });
      toast.success(projectArchived ? 'Board unarchived' : 'Board archived');
    } catch {
      toast.error('Unable to update archive state');
    } finally {
      setConfirmArchive(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(projectId);
      toast.success('Board deleted');
      onDeleted();
    } catch {
      toast.error('Unable to delete board');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <SectionCard
        icon={TriangleAlert}
        title="Danger zone"
        hint="Irreversible actions for this board"
        tone="danger"
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setConfirmArchive(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-destructive/20 bg-card px-3 py-2.5 text-left transition-colors hover:bg-destructive/[0.04]"
          >
            <Pencil className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {projectArchived ? 'Unarchive board' : 'Archive board'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {projectArchived
                  ? 'Restore to active boards'
                  : 'Hide from active boards'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-destructive/20 bg-card px-3 py-2.5 text-left transition-colors hover:bg-destructive/[0.04]"
          >
            <Trash2 className="size-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-destructive">
                Delete board
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Permanently remove board and cards
              </p>
            </div>
          </button>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        variant="warning"
        title={projectArchived ? 'Unarchive board?' : 'Archive board?'}
        description={
          projectArchived
            ? 'This board will become active again.'
            : 'This board will be hidden from your active boards. You can unarchive it anytime.'
        }
        primaryLabel={projectArchived ? 'Unarchive' : 'Archive'}
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title="Delete this board permanently?"
        description={
          <>
            All columns and cards in <strong>{projectName}</strong> will be
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

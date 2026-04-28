'use client';

import { useState } from 'react';
import { Pencil, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
    setConfirmArchive(false);
    try {
      await updateProject(projectId, { archived: !projectArchived });
      toast.success(projectArchived ? 'Board unarchived' : 'Board archived');
    } catch {
      toast.error('Unable to update archive state');
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

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {projectArchived ? 'Unarchive board?' : 'Archive board?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {projectArchived
                ? 'This board will become active again.'
                : 'This board will be hidden from your active boards. You can unarchive it anytime.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              {projectArchived ? 'Unarchive' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this board permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              All columns and cards in <strong>{projectName}</strong> will be
              removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete board'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

/** "Leave Website Relaunch?" */
export const LeaveBoardDialog = ({
  open,
  onOpenChange,
  boardName,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardName: string;
  loading: boolean;
  onConfirm: () => void | Promise<void>;
}) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    variant="warning"
    title={`Leave ${boardName}?`}
    description="You lose access right away. An admin can invite you back."
    primaryLabel={loading ? 'Leaving…' : 'Leave board'}
    onConfirm={onConfirm}
    loading={loading}
  />
);

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { accountServices } from '@/services/account.service';
import { useUserStore } from '@/store';

/** The display name field: edit, save, and refresh the session after. */
export function useProfileForm() {
  const { data: session, update } = useSession();
  const savedName = session?.user?.fullName || session?.user?.name || '';
  // null = untouched, so the field follows the session until edited
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const name = draft ?? savedName;
  const dirty = name.trim().length > 0 && name.trim() !== savedName;

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const { updated } = await accountServices.updateProfile({
        fullName: name.trim(),
      });
      // re-read the name into the session, and into cached people
      await update({});
      const userId = session?.user?.id;
      if (updated && userId) {
        useUserStore.setState((state) =>
          state.users[userId]
            ? {
                users: {
                  ...state.users,
                  [userId]: {
                    ...state.users[userId],
                    fullName: updated.fullName,
                  },
                },
              }
            : state,
        );
      }
      setDraft(null);
      toast.success('Profile saved');
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ??
          'Couldn’t save your profile',
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    userId: session?.user?.id ?? '',
    email: session?.user?.email ?? '',
    avatar: session?.user?.avatar ?? session?.user?.image ?? null,
    savedName,
    name,
    setName: setDraft,
    dirty,
    saving,
    save,
  };
}

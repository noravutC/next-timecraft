'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { defaultDeletionChoices } from '@/helper/utils/account-deletion';
import { accountServices } from '@/services/account.service';
import type { AccountDeletionPlan, DeletionChoice } from '@/types';

type Choices = ReturnType<typeof defaultDeletionChoices>;

/** Loads what the account owns when the dialog opens, then deletes it. */
export function useDeleteAccount(open: boolean) {
  const { data: session } = useSession();
  const email = session?.user?.email ?? '';
  const [plan, setPlan] = useState<AccountDeletionPlan | null>(null);
  const [choices, setChoices] = useState<Choices>({ boards: {} });
  const [phrase, setPhrase] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    accountServices
      .getDeletionPlan()
      .then(({ data }) => {
        if (!alive || !data) return;
        setPlan(data);
        setChoices(defaultDeletionChoices(data));
      })
      .catch(() => toast.error('Couldn’t load the boards you own'));
    return () => {
      alive = false;
    };
  }, [open]);

  const matches =
    email.length > 0 && phrase.trim().toLowerCase() === email.toLowerCase();

  const confirm = async () => {
    if (!plan || !matches || deleting) return;
    setDeleting(true);
    try {
      await accountServices.deleteAccount({
        confirmEmail: phrase.trim(),
        ...choices,
      });
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ??
          'Couldn’t delete your account',
      );
      setDeleting(false);
    }
  };

  return {
    email,
    plan,
    choices,
    chooseBoard: (id: string, choice: DeletionChoice) =>
      setChoices((c) => ({ ...c, boards: { ...c.boards, [id]: choice } })),
    chooseWorkspace: (choice: DeletionChoice) =>
      setChoices((c) => ({ ...c, workspace: choice })),
    phrase,
    setPhrase,
    matches,
    deleting,
    confirm,
  };
}

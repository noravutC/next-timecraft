'use client';

import { useSession } from 'next-auth/react';
import { isGuestSession } from '@/lib/guest';
import { SettingsHeading } from '../_components/settings-heading';
import { AccountDangerZone } from './_components/account-danger-zone';
import { GuestDemoNote } from './_components/guest-demo-note';
import { ProfileDetails } from './_components/profile-details';

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const guest = isGuestSession(session);

  return (
    <>
      <SettingsHeading title="Profile">
        How you appear to people on your boards.
      </SettingsHeading>
      {guest && <GuestDemoNote />}
      <ProfileDetails guest={guest} />
      {!guest && <AccountDangerZone />}
    </>
  );
}

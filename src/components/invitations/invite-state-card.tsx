'use client';

import type { ReactNode } from 'react';
import { CalendarX, Mail, MailQuestion, UserPlus } from 'lucide-react';
import { GoogleIcon } from '@/components/auth/google-icon';
import { Button } from '@/components/ui/button';
import type { InviteView } from '@/helper/utils/invite-view';
import { InviteCard } from './invite-card';
import { InviteTile } from './invite-tile';

type CardView = Exclude<InviteView, 'checking-session' | 'loading-preview'>;

/** What the invitation is for: a board or a workspace. */
export interface InviteTarget {
  kind: 'board' | 'workspace';
  /** null until the preview has loaded */
  name: string | null;
  /** 44px tile for the board or workspace */
  tile: ReactNode;
  /** the role offered and what it allows */
  roleLine: ReactNode;
  /** the button after joining, e.g. "Go to board" */
  openLabel: string;
}

interface InviteStateCardProps {
  view: CardView;
  target: InviteTarget;
  /** the address the invitation was sent to */
  invitedEmail: string | null;
  sessionEmail: string;
  accepting: boolean;
  onAccept: () => void;
  onSignIn: () => void;
  onSwitchAccount: () => void;
  onGoToBoards: () => void;
}

/** The one card for the current invitation state. */
export const InviteStateCard = ({
  view,
  target,
  invitedEmail,
  sessionEmail,
  accepting,
  onAccept,
  onSignIn,
  onSwitchAccount,
  onGoToBoards,
}: InviteStateCardProps) => {
  const name = target.name ?? `this ${target.kind}`;
  const goToBoards = (
    <Button
      variant="outline"
      size="lg"
      onClick={onGoToBoards}
      className="w-full"
    >
      Go to my boards
    </Button>
  );

  switch (view) {
    case 'signed-out':
      return (
        <InviteCard
          tile={
            <InviteTile tone="outline">
              <UserPlus />
            </InviteTile>
          }
          title={`You’ve been invited to a ${target.kind}`}
          action={
            <Button
              variant="outline"
              size="lg"
              onClick={onSignIn}
              className="w-full gap-2.5"
            >
              <GoogleIcon className="size-4.25" />
              Continue with Google
            </Button>
          }
        >
          Sign in with the email the invitation was sent to.
        </InviteCard>
      );

    case 'not-found':
      return (
        <InviteCard
          tile={
            <InviteTile tone="outline">
              <MailQuestion />
            </InviteTile>
          }
          title="Invitation not found"
          action={goToBoards}
        >
          Check the link in your email, or ask a {target.kind} admin to send a
          new invitation.
        </InviteCard>
      );

    case 'wrong-account':
      return (
        <InviteCard
          tile={
            <InviteTile tone="warning">
              <Mail />
            </InviteTile>
          }
          title="Wrong account"
          action={
            <Button
              variant="outline"
              size="lg"
              onClick={onSwitchAccount}
              className="w-full"
            >
              Switch account
            </Button>
          }
        >
          This invitation was sent to <strong>{invitedEmail}</strong>, but
          you’re signed in as <strong>{sessionEmail}</strong>.
        </InviteCard>
      );

    case 'expired':
    case 'revoked':
      return (
        <InviteCard
          tile={
            <InviteTile tone="outline">
              <CalendarX />
            </InviteTile>
          }
          title={
            view === 'expired'
              ? 'This invitation has expired'
              : 'This invitation was revoked'
          }
          action={goToBoards}
        >
          Ask a {target.kind} admin of <strong>{name}</strong> to send you a new
          invitation.
        </InviteCard>
      );

    case 'accepted':
      return (
        <InviteCard
          tile={target.tile}
          title={`Join ${name}`}
          action={
            <Button size="lg" onClick={onGoToBoards} className="w-full">
              {target.openLabel}
            </Button>
          }
        >
          You already accepted this invitation.
        </InviteCard>
      );

    case 'valid':
      return (
        <InviteCard
          tile={target.tile}
          title={`Join ${name}`}
          action={
            <Button
              size="lg"
              onClick={onAccept}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? 'Joining…' : 'Accept invitation'}
            </Button>
          }
        >
          {target.roleLine}
        </InviteCard>
      );
  }
};

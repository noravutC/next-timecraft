'use client';

import { CalendarX, Mail, MailQuestion, UserPlus } from 'lucide-react';
import { GoogleIcon } from '@/components/auth/google-icon';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { Button } from '@/components/ui/button';
import type { InviteView } from '@/helper/utils/invite-view';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import type { InvitationPreview } from '@/types';
import { InviteCard } from './invite-card';
import { ROLE_JOIN_COPY } from './invite-copy';
import { InviteTile } from './invite-tile';

type CardView = Exclude<InviteView, 'checking-session' | 'loading-preview'>;

interface InviteStateCardProps {
  view: CardView;
  preview: InvitationPreview | null;
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
  preview,
  sessionEmail,
  accepting,
  onAccept,
  onSignIn,
  onSwitchAccount,
  onGoToBoards,
}: InviteStateCardProps) => {
  const boardName = preview?.projectName ?? 'this board';
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
  const boardTile = (
    <ProjectAvatar
      project={{ name: boardName, coverImage: null, settings: null }}
      size="size-11"
      rounded="rounded-popover"
      textSize="text-lg"
    />
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
          title="You’ve been invited to a board"
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
          Check the link in your email, or ask a board admin to send a new
          invitation.
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
          This invitation was sent to <strong>{preview?.email}</strong>, but
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
          Ask a board admin of <strong>{boardName}</strong> to send you a new
          invitation.
        </InviteCard>
      );

    case 'accepted':
      return (
        <InviteCard
          tile={boardTile}
          title={`Join ${boardName}`}
          action={
            <Button size="lg" onClick={onGoToBoards} className="w-full">
              Go to board
            </Button>
          }
        >
          You already accepted this invitation.
        </InviteCard>
      );

    case 'valid': {
      const role = preview?.role ?? 'viewer';
      return (
        <InviteCard
          tile={boardTile}
          title={`Join ${boardName}`}
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
          You’ve been invited to this board as {ROLE_JOIN_COPY[role].article}{' '}
          <strong>{ROLE_LABELS[role]}</strong>. {ROLE_JOIN_COPY[role].hint}
        </InviteCard>
      );
    }
  }
};

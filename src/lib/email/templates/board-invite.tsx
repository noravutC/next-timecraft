import { Link, Text } from '@react-email/components';
import { appUrl } from '@/lib/app-url';
import { EmailLayout, emailText } from './email-layout';

interface BoardInviteEmailProps {
  inviterName: string;
  boardName: string;
  roleLabel: string;
  acceptUrl: string;
}

export const BoardInviteEmail = ({
  inviterName,
  boardName,
  roleLabel,
  acceptUrl,
}: BoardInviteEmailProps) => (
  <EmailLayout
    preview={`${inviterName} invited you to ${boardName} on TimeCraft`}
    heading={`${inviterName} invited you to “${boardName}”`}
    cta={{ label: 'Accept invitation', href: acceptUrl }}
    afterCta={
      <Text style={emailText.note}>
        This invitation expires in 7 days. If the button doesn&rsquo;t work,
        open this link:
        <br />
        <Link href={acceptUrl} style={emailText.link}>
          {acceptUrl}
        </Link>
      </Text>
    }
    footer={
      <>
        Invitations always send an email, so people without an account can join.
        Manage other emails in{' '}
        <Link
          href={`${appUrl()}/settings/notifications`}
          style={emailText.footerLink}
        >
          Notification settings
        </Link>
      </>
    }
  >
    <Text style={emailText.paragraph}>
      {`Join the board ${boardName} as ${roleLabel} to collaborate on tasks together.`}
    </Text>
  </EmailLayout>
);

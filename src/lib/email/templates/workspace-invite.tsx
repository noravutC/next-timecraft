import { Link, Text } from '@react-email/components';
import { EmailLayout, emailText } from './email-layout';

interface WorkspaceInviteEmailProps {
  inviterName: string;
  workspaceName: string;
  roleLabel: string;
  roleHint: string;
  acceptUrl: string;
}

export const WorkspaceInviteEmail = ({
  inviterName,
  workspaceName,
  roleLabel,
  roleHint,
  acceptUrl,
}: WorkspaceInviteEmailProps) => (
  <EmailLayout
    preview={`${inviterName} invited you to ${workspaceName} on TimeCraft`}
    heading={`${inviterName} invited you to ${workspaceName}`}
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
    footer="You got this because someone invited this address to their TimeCraft workspace. If you weren’t expecting it, you can ignore this email."
  >
    <Text style={emailText.paragraph}>
      Join the workspace <strong>{workspaceName}</strong> as{' '}
      <strong>{roleLabel}</strong>. {roleHint}
    </Text>
  </EmailLayout>
);

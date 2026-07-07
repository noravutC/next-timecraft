import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BoardInviteEmailProps {
  inviterName: string;
  boardName: string;
  roleLabel: string;
  acceptUrl: string;
}

const main = {
  backgroundColor: '#f6f7f9',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  padding: '40px 16px',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '40px',
  maxWidth: '480px',
  margin: '0 auto',
};

const brand = {
  color: '#6366f1',
  fontSize: '14px',
  fontWeight: 800 as const,
  letterSpacing: '-0.2px',
  margin: '0 0 24px',
};

const heading = {
  color: '#1f2430',
  fontSize: '22px',
  fontWeight: 800 as const,
  letterSpacing: '-0.4px',
  lineHeight: '1.3',
  margin: '0 0 12px',
};

const paragraph = {
  color: '#3a4150',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 28px',
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700 as const,
  padding: '12px 28px',
  textDecoration: 'none',
};

const muted = {
  color: '#9aa2b1',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '28px 0 4px',
};

const linkStyle = {
  color: '#6366f1',
  fontSize: '13px',
  wordBreak: 'break-all' as const,
};

export const BoardInviteEmail = ({
  inviterName,
  boardName,
  roleLabel,
  acceptUrl,
}: BoardInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {inviterName} invited you to {boardName} on TimeCraft
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>TimeCraft</Text>
        <Heading style={heading}>
          {inviterName} invited you to &ldquo;{boardName}&rdquo;
        </Heading>
        <Text style={paragraph}>
          Join the board <strong>{boardName}</strong> as{' '}
          <strong>{roleLabel}</strong> to collaborate on tasks together.
        </Text>
        <Section style={{ textAlign: 'center' as const }}>
          <Button href={acceptUrl} style={button}>
            Accept invitation
          </Button>
        </Section>
        <Text style={muted}>
          This invitation expires in 7 days. If the button doesn&rsquo;t work,
          open this link:
        </Text>
        <Link href={acceptUrl} style={linkStyle}>
          {acceptUrl}
        </Link>
      </Container>
    </Body>
  </Html>
);

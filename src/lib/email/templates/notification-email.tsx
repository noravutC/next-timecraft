import { Link, Section, Text } from '@react-email/components';
import { EmailLayout, emailText } from './email-layout';

const quote = {
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0 0 24px',
};

const taskBox = {
  border: '1px solid #ebebeb',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0 0 24px',
};

export interface NotificationEmailProps {
  heading: string;
  /** one line under the heading, e.g. "On the Website Relaunch board." */
  body: string;
  /** a comment, quoted */
  quote?: { by: string; text: string };
  /** a task, boxed: title, then a line like "Website Relaunch · To do" */
  task?: { title: string; meta: string; due?: string };
  cta: { label: string; href: string };
  /** why this was sent, ending before the settings link */
  why: string;
  settingsUrl: string;
}

/** Mentions, replies, assignments, reminders and the rest, in one frame. */
export const NotificationEmail = ({
  heading,
  body,
  quote: quoted,
  task,
  cta,
  why,
  settingsUrl,
}: NotificationEmailProps) => (
  <EmailLayout
    preview={heading}
    heading={heading}
    cta={cta}
    footer={
      <>
        {why}{' '}
        <Link href={settingsUrl} style={{ color: '#4d4d4d' }}>
          Notification settings
        </Link>
      </>
    }
  >
    <Text style={emailText.paragraph}>{body}</Text>
    {quoted && (
      <Section style={quote}>
        <Text style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600 }}>
          {quoted.by}
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: '15px',
            lineHeight: '23px',
            color: '#262626',
          }}
        >
          {quoted.text}
        </Text>
      </Section>
    )}
    {task && (
      <Section style={taskBox}>
        <Text style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600 }}>
          {task.title}
        </Text>
        <Text style={{ margin: 0, fontSize: '13px', color: '#4d4d4d' }}>
          {task.meta}
          {task.due && (
            <>
              {'  ·  '}
              <span style={{ color: '#a35a00', fontWeight: 600 }}>
                {task.due}
              </span>
            </>
          )}
        </Text>
      </Section>
    )}
  </EmailLayout>
);

import { Column, Link, Row, Section, Text } from '@react-email/components';
import type {
  DigestEmailContent,
  DigestTone,
} from '@/helper/utils/digest-email';
import { EmailLayout, emailText } from './email-layout';

const section = { margin: '0 0 24px' };

const sectionTitle = {
  color: '#171717',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: '20px',
  margin: '0 0 8px',
};

const tile = {
  border: '1px solid #ebebeb',
  borderRadius: '10px',
  padding: '12px 14px',
  verticalAlign: 'top' as const,
  width: '31%',
};

const tileValue = {
  color: '#171717',
  fontSize: '24px',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  lineHeight: '30px',
  margin: 0,
};

const small = { fontSize: '12px', lineHeight: '16px', margin: '2px 0 0' };

const listRow = { borderTop: '1px solid #f0f0f0', padding: '8px 0' };

const rowTitle = {
  color: '#171717',
  fontSize: '13px',
  lineHeight: '20px',
  margin: 0,
};

const tick = {
  backgroundColor: '#10b981',
  borderRadius: '999px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: 700,
  height: '14px',
  lineHeight: '14px',
  textAlign: 'center' as const,
  width: '14px',
};

const CHIP_TONES: Record<
  DigestTone,
  { backgroundColor: string; color: string }
> = {
  danger: { backgroundColor: '#fdecea', color: '#b42318' },
  warning: { backgroundColor: '#fef3e2', color: '#6b3a00' },
  neutral: { backgroundColor: '#f5f5f5', color: '#4d4d4d' },
};

const chip = {
  borderRadius: '999px',
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: '22px',
  textAlign: 'center' as const,
  width: '76px',
};

const more = { ...listRow, color: '#707070', fontSize: '12px', margin: 0 };

export type WeeklyDigestEmailProps = Omit<DigestEmailContent, 'subject'> & {
  /** the board's Insights view, where the digest is also turned off */
  insightsUrl: string;
};

/** Monday's email: what a board finished last week and what needs a look. */
export const WeeklyDigestEmail = ({
  boardName,
  weekLabel,
  tiles,
  finished,
  finishedMore,
  attention,
  attentionMore,
  insightsUrl,
}: WeeklyDigestEmailProps) => (
  <EmailLayout
    preview={`${boardName}: ${weekLabel.toLowerCase()}`}
    heading={boardName}
    width={560}
    cta={{ label: 'Open Insights', href: insightsUrl }}
    footer={
      <>
        You get this email because the weekly digest is on for {boardName}.{' '}
        <Link href={insightsUrl} style={emailText.footerLink}>
          Turn it off
        </Link>
      </>
    }
  >
    <Text
      style={{ ...emailText.paragraph, fontSize: '13px', lineHeight: '20px' }}
    >
      {weekLabel}
    </Text>

    <Section style={section}>
      <Row>
        {tiles.flatMap((t, i) => [
          ...(i > 0 ? [<Column key={`${t.label}-gap`} width={10} />] : []),
          <Column key={t.label} style={tile}>
            <Text style={tileValue}>
              {t.value}
              {t.unit && (
                <span
                  style={{
                    color: '#707070',
                    fontSize: '13px',
                    fontWeight: 400,
                    letterSpacing: 0,
                    lineHeight: '13px',
                  }}
                >
                  {' '}
                  {t.unit}
                </span>
              )}
            </Text>
            <Text style={{ ...small, color: '#4d4d4d' }}>{t.label}</Text>
            <Text style={{ ...small, color: '#707070' }}>{t.note}</Text>
          </Column>,
        ])}
      </Row>
    </Section>

    {finished.length > 0 && (
      <Section style={section}>
        <Text style={sectionTitle}>Finished last week</Text>
        {finished.map((f, i) => (
          <Row key={i} style={listRow}>
            <Column width={24}>
              <span style={tick}>✓</span>
            </Column>
            <Column>
              <Text style={rowTitle}>{f.title}</Text>
            </Column>
            <Column align="right" style={{ whiteSpace: 'nowrap' }}>
              <Text style={{ ...rowTitle, color: '#707070', fontSize: '12px' }}>
                {f.by}
              </Text>
            </Column>
          </Row>
        ))}
        {finishedMore > 0 && <Text style={more}>and {finishedMore} more</Text>}
      </Section>
    )}

    {attention.length > 0 && (
      <Section style={section}>
        <Text style={sectionTitle}>Needs attention</Text>
        {attention.map((a, i) => (
          <Row key={i} style={listRow}>
            <Column width={86} style={{ verticalAlign: 'top' }}>
              <span style={{ ...chip, ...CHIP_TONES[a.tone] }}>{a.label}</span>
            </Column>
            <Column>
              <Text style={rowTitle}>{a.title}</Text>
              <Text style={{ ...small, color: '#707070', margin: 0 }}>
                {a.why}
              </Text>
            </Column>
          </Row>
        ))}
        {attentionMore > 0 && (
          <Text style={more}>and {attentionMore} more</Text>
        )}
      </Section>
    )}
  </EmailLayout>
);

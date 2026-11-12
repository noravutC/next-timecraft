import type { ReactNode } from 'react';
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { appUrl } from '@/lib/app-url';

// Inline styles only: email clients drop <style> blocks and CSS variables.
const main = {
  backgroundColor: '#f5f5f5',
  color: '#171717',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  padding: '48px 16px',
};

const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #ebebeb',
  borderRadius: '12px',
  padding: '32px',
  maxWidth: '480px',
  margin: '0 auto',
};

const brandRow = { margin: '0 0 20px' };

const brandMark = { display: 'block' };

const brandName = {
  color: '#171717',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  margin: 0,
  paddingLeft: '8px',
};

const heading = {
  color: '#171717',
  fontSize: '20px',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  lineHeight: '28px',
  margin: '0 0 12px',
};

const button = {
  backgroundColor: '#171717',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '11px 20px',
  textDecoration: 'none',
};

const divider = { borderColor: '#ebebeb', margin: '24px 0 16px' };

/** Body text, notes under the button and the footer, for templates to share. */
export const emailText = {
  paragraph: {
    color: '#4d4d4d',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 24px',
  },
  note: {
    color: '#707070',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '20px 0 0',
  },
  link: { color: '#171717', fontSize: '13px', wordBreak: 'break-all' as const },
  footer: { color: '#707070', fontSize: '12px', lineHeight: '18px', margin: 0 },
  footerLink: { color: '#4d4d4d', textDecoration: 'underline' },
};

interface EmailLayoutProps {
  preview: string;
  heading: string;
  /** paragraphs above the button */
  children: ReactNode;
  cta: { label: string; href: string };
  /** under the button, e.g. the plain link */
  afterCta?: ReactNode;
  /** why this email was sent */
  footer: ReactNode;
  /** the card's width in px, for emails that carry more than a paragraph */
  width?: number;
}

/** The frame every TimeCraft email shares: brand, heading, one button, footer. */
export const EmailLayout = ({
  preview,
  heading: title,
  children,
  cta,
  afterCta,
  footer,
  width,
}: EmailLayoutProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={width ? { ...card, maxWidth: `${width}px` } : card}>
        {/* a PNG: email clients don't show SVG */}
        <Section style={brandRow}>
          <Row>
            <Column width={20}>
              <Img
                src={`${appUrl()}/email/logo-mark.png`}
                width={20}
                height={20}
                alt=""
                style={brandMark}
              />
            </Column>
            <Column>
              <Text style={brandName}>TimeCraft</Text>
            </Column>
          </Row>
        </Section>
        <Heading style={heading}>{title}</Heading>
        {children}
        <Button href={cta.href} style={button}>
          {cta.label}
        </Button>
        {afterCta}
        <Hr style={divider} />
        <Text style={emailText.footer}>{footer}</Text>
      </Container>
    </Body>
  </Html>
);

import type { ReactElement } from 'react';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';

export const appUrl = () =>
  process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

/**
 * Renders and sends one email through Resend. Never throws: an email only
 * carries a link, so a failure is logged and the action that sent it still
 * succeeds.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  email: ReactElement;
  /** what is being sent, for the logs */
  kind: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn(
      { to: input.to, kind: input.kind },
      'RESEND_API_KEY not set, email skipped (invite links can still be copied)',
    );
    return;
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      // Resend rejects sending from a plain gmail address; fall back to its
      // shared test sender (only delivers to your own Resend account email).
      // Set EMAIL_FROM to a verified-domain address to send to anyone.
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
      to: input.to,
      subject: input.subject,
      html: await render(input.email),
    });
    if (error) {
      logger.error(
        { err: error, to: input.to, kind: input.kind },
        'Resend refused the email',
      );
    }
  } catch (err) {
    logger.error(
      { err, to: input.to, kind: input.kind },
      'Failed to send email',
    );
  }
}

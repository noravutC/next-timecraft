import { render } from '@react-email/components';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { BoardInviteEmail } from './templates/board-invite';

export const appUrl = () =>
  process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

// ไม่ throw เด็ดขาด — อีเมลเป็นแค่ท่อส่งลิงก์ ถ้าส่งไม่ได้ invite ยังใช้งานได้
// ผ่าน copy invite link ใน dialog
export async function sendBoardInviteEmail(input: {
  to: string;
  inviterName: string;
  boardName: string;
  roleLabel: string;
  token: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn(
      { to: input.to },
      'RESEND_API_KEY not set — invite email skipped, share the invite link from the dialog instead',
    );
    return;
  }

  try {
    const acceptUrl = `${appUrl()}/invite/${input.token}`;
    const html = await render(
      BoardInviteEmail({
        inviterName: input.inviterName,
        boardName: input.boardName,
        roleLabel: input.roleLabel,
        acceptUrl,
      }),
    );

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'TimeCraft <onboarding@resend.dev>',
      to: input.to,
      subject: `${input.inviterName} invited you to "${input.boardName}" on TimeCraft`,
      html,
    });
  } catch (err) {
    logger.error({ err, to: input.to }, 'Failed to send board invite email');
  }
}

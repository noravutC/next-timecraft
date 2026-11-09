import { appUrl, sendEmail } from './send-email';
import { BoardInviteEmail } from './templates/board-invite';

// ไม่ throw เด็ดขาด — อีเมลเป็นแค่ท่อส่งลิงก์ ถ้าส่งไม่ได้ invite ยังใช้งานได้
// ผ่าน copy invite link ใน dialog
export async function sendBoardInviteEmail(input: {
  to: string;
  inviterName: string;
  boardName: string;
  roleLabel: string;
  token: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `${input.inviterName} invited you to "${input.boardName}" on TimeCraft`,
    email: BoardInviteEmail({
      inviterName: input.inviterName,
      boardName: input.boardName,
      roleLabel: input.roleLabel,
      acceptUrl: `${appUrl()}/invite/${input.token}`,
    }),
    kind: 'board-invite',
  });
}

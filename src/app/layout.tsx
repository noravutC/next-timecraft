import { Geist, Geist_Mono, Noto_Sans_Thai } from 'next/font/google';
// import './globals.css';
import './globals.css';
import AuthProvider from '@/components/SessionProvider';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

// ตัวเลข / เวลา / คีย์ลัด (font-mono)
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

// ฟอนต์คู่สำหรับตัวอักษรไทย — Geist ไม่มี glyph ไทย เบราว์เซอร์จะ
// fallback มาตัวนี้เฉพาะตัวไทย ส่วน Latin ยังเป็น Geist ตามเดิม
const notoSansThai = Noto_Sans_Thai({
  variable: '--font-noto-thai',
  subsets: ['thai'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// Every page renders per request: the CSP nonce from src/proxy.ts has to be
// stamped on each script, which a prerendered page can't have.
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full w-full overflow-hidden ${geistSans.variable} ${geistMono.variable} ${notoSansThai.variable}`}
    >
      <body className="h-full w-full overflow-hidden font-sans">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

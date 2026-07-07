import { Noto_Sans_Thai, Plus_Jakarta_Sans } from 'next/font/google';
// import './globals.css';
import './globals.css';
import AuthProvider from '@/components/SessionProvider';
import { Toaster } from '@/components/ui/sonner';

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// ฟอนต์คู่สำหรับตัวอักษรไทย — Jakarta ไม่มี glyph ไทย เบราว์เซอร์จะ
// fallback มาตัวนี้เฉพาะตัวไทย ส่วน Latin ยังเป็น Jakarta ตามเดิม
const notoSansThai = Noto_Sans_Thai({
  variable: '--font-noto-thai',
  subsets: ['thai'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full w-full overflow-hidden ${jakartaSans.variable} ${notoSansThai.variable}`}
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

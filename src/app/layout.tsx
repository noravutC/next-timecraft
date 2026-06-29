import { Open_Sans } from 'next/font/google';
// import './globals.css';
import './globals.css';
import AuthProvider from '@/components/SessionProvider';
import { Toaster } from '@/components/ui/sonner';

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
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
      className={`h-full w-full overflow-hidden ${openSans.variable}`}
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

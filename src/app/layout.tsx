
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full w-full overflow-hidden">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full w-full overflow-hidden`}>
        <AuthProvider>
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}

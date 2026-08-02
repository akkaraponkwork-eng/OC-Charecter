import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import ToastContainer from '@/components/ToastContainer';
import FloatingChatWidget from '@/components/FloatingChatWidget';

export const metadata: Metadata = {
  title: 'OC Creator — Original Character Studio',
  description: 'สร้าง จัดการ และแบ่งปันตัวละครต้นฉบับของคุณ | Create, manage and share your original characters',
  keywords: ['original character', 'OC', 'character creator', 'anime', 'art'],
  openGraph: {
    title: 'OC Creator',
    description: 'Original Character Studio',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="mesh-bg" aria-hidden="true" />
        <SessionProvider>
          {children}
          <FloatingChatWidget />
        </SessionProvider>
        <ToastContainer />
      </body>
    </html>
  );
}

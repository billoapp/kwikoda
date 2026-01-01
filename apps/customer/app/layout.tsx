import type { Metadata } from 'next';
import './globals.css';  // ← Make sure this line exists
import { ToastProvider } from '@/components/ui/Toast';
import PWAInstall from '@/components/PWAInstall';
import OnlineStatus from '@/components/OnlineStatus';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tabeza',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ToastProvider>
          <PWAInstall />
          <OnlineStatus />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
import type { Metadata, Viewport } from 'next';
import './globals.css';
import OneSignalInit from '@/components/OneSignalInit';
import IOSInstallPrompt from '@/components/IOSInstallPrompt';

export const metadata: Metadata = {
  title: 'Ramadhan Time',
  description: 'Prayer times, daily agenda, and Ramadhan companion — brutalist PWA',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ramadhan Time',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <OneSignalInit />
        {children}
        <IOSInstallPrompt />
      </body>
    </html>
  );
}

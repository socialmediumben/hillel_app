import type { Metadata } from 'next';
import './globals.css';
import { ConfigProvider } from '@/context/ConfigContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Hillel Check-In & Student Hub',
  description: 'Interactive Check-In Kiosk & Student Community Hub for Hillel',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hillel Hub',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-200">
        <ConfigProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}

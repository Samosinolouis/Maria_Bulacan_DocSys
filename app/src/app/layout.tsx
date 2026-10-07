import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import SessionGate from '@/components/SessionGate';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: "DMS - Municipal Administrator's Office | Bayan ng Santa Maria, Bulacan",
  description:
    'Official Cloud-Based Document Management System and Venue Executive Operations of Santa Maria, Bulacan. In compliance with RA 11032 (3-Day Turnaround Mandate) and DICT GWTS v25.3.3.',
  icons: {
    icon: [
      { url: '/assets/bulacan-logo.png', sizes: 'any', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/assets/bulacan-logo.png',
    apple: '/assets/bulacan-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/assets/bulacan-logo.png" type="image/png" />
        <link rel="shortcut icon" href="/assets/bulacan-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/bulacan-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#F8FAFC] text-[#0F172A] selection:bg-[#FCD116] selection:text-[#081E36]">
        {/* Auth provider: NextAuth (Keycloak) -> services -> authorization -> app state. */}
        <AuthProvider>
          <SessionGate>
            <AppLayout>{children}</AppLayout>
          </SessionGate>
        </AuthProvider>
      </body>
    </html>
  );
}

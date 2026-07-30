import type { Metadata } from 'next';
import '@/styles/globals.css';
import { SessionProvider } from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'P1 VoIP Platform - Enterprise Call Center',
  description: 'Professional VoIP call center dashboard with advanced call management',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

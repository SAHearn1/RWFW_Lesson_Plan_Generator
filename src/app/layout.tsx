import '@/styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SiteHeader } from '@/components/navigation/site-header';
import { AuthProvider } from '@/components/providers/session-provider';

export const metadata: Metadata = {
  title: 'Rootwork Framework Lesson Plan Generator',
  description: 'Healing-Centered Lesson Design',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className='font-sans'>
        <AuthProvider>
          <SiteHeader />
          <main>{children}</main>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

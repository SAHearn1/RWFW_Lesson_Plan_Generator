import '@/styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SiteHeader } from '@/components/navigation/site-header';
import Providers from './providers';

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
        <Providers>
          <SiteHeader />
          <main>{children}</main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

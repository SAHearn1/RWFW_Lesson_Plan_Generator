import { SessionProvider } from 'next-auth/react';
import React from 'react';

import { getServerAuthSession } from '@/lib/auth';

import { SiteHeader } from '@/components/navigation/site-header';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Rootwork Framework Lesson Plan Generator',
  description: 'Healing-Centered Lesson Design',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

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

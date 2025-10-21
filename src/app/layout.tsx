import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';

import { SiteHeader } from '@/components/navigation/site-header';
import { AuthProvider } from '@/components/providers/session-provider';
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Rootwork Framework Lesson Plan Generator",
  description: "Healing-Centered Lesson Design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <SiteHeader />
          <main>{children}</main>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

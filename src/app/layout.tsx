import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';

import { SiteHeader } from '@/components/navigation/site-header';
import { AuthProvider } from '@/components/providers/session-provider';
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <AuthProvider>
          <SiteHeader />
          <main>{children}</main>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

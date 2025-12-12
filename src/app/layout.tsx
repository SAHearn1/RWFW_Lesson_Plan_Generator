import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/navigation/site-header";
import { getServerAuthSession } from "@/lib/auth";

import Providers from "./providers";

export const metadata: Metadata = {
  title: "Rootwork Framework Lesson Plan Generator",
  description: "Healing-Centered Lesson Design",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerAuthSession();

  return (
    <html lang="en">
      <body className="font-sans">
        <Providers session={session}>
          <SiteHeader />
          <main>{children}</main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

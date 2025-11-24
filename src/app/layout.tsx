import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/navigation/site-header";
import { getServerAuthSession } from "@/lib/auth";

import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-eb-garamond",
});

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
      <body className={`${inter.className} ${ebGaramond.variable}`}>
        <Providers session={session}>
          <SiteHeader />
          <main>{children}</main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

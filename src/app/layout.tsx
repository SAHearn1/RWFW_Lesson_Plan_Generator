// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400','500','600','700','800'],
  display: 'swap',
});

const jet = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400','500','600','700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Root Work Framework',
  description: 'Professional lesson planning & PD built on the Root Work Framework.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jet.variable}`}>
      <body className="font-sans min-h-full">
        {children}
      </body>
    </html>
  );
}

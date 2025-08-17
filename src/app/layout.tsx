/ ============================================
// FILE: src/app/layout.tsx
// Root Layout with Garden to Growth Theming
// ============================================
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Lesson Plan Generator - Root Work Framework',
  description: 'AI-powered lesson planning with equity-first, trauma-informed design',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-body bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}


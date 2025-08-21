// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Root Work Framework — Lesson Plan Generator',
  description: 'Professional, trauma-informed lesson planning with the Root Work Framework.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white text-[#2B2B2B]">
        {/* Global header with brand & logo */}
        <header className="bg-[#082A19] text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Root Work Framework"
                width={44}
                height={44}
                className="rounded-full border-2 border-[#D4C862] bg-white"
              />
              <div>
                <div className="text-lg font-extrabold leading-tight" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Root Work Framework
                </div>
                <div className="text-sm text-[#D4C862]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Professional Lesson Planning
                </div>
              </div>
            </Link>
            <nav className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Link href="/" className="hover:text-[#D4C862] transition-colors">Home</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        {/* Global footer */}
        <footer className="mt-16 border-t-2 border-[#F2F4CA]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 text-center text-sm text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
            © {new Date().getFullYear()} Root Work Framework — Professional, trauma-informed learning design
          </div>
        </footer>
      </body>
    </html>
  );
}

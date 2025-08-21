// src/app/layout.tsx
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Root Work Framework — Lesson Plan Generator',
  description: 'Professional, trauma-informed lesson planning with the Root Work Framework.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white text-[#2B2B2B]">
        {/* Global Header */}
        <header className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b-2 border-[#D4C862]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Root Work Framework"
                className="w-10 h-10 rounded-full border-2 border-[#D4C862] bg-white"
              />
              <div>
                <div className="text-xl font-extrabold text-[#082A19]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Root Work Framework
                </div>
                <div className="text-sm text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Professional, trauma-informed lesson planning
                </div>
              </div>
            </Link>
            <nav className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Link href="/generate" className="text-[#082A19] hover:text-black font-semibold">
                Generate a Lesson
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        {/* Global Footer */}
        <footer className="mt-16 border-t-2 border-[#F2F4CA]">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
            © {new Date().getFullYear()} Root Work Framework — Healing-centered, regenerative learning design
          </div>
        </footer>
      </body>
    </html>
  );
}

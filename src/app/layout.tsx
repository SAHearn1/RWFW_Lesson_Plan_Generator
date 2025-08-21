// /src/app/layout.tsx
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Root Work Framework — Lesson Plan Generator',
  description: 'Professional, trauma-informed RWFW lesson planning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white text-[#2B2B2B]">
        {/* Global header with logo */}
        <header className="bg-[#082A19] text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Link href="/" className="flex items-center space-x-3">
                <img
                  src="/logo.png"
                  alt="Root Work Framework"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-[#D4C862] bg-white object-contain"
                />
                <div>
                  <div className="text-lg font-extrabold tracking-tight">Root Work Framework</div>
                  <div className="text-sm text-[#D4C862]">Professional Lesson Planning</div>
                </div>
              </Link>
              <nav className="flex items-center gap-6">
                <Link className="hover:text-[#D4C862]" href="/">Home</Link>
                <Link className="hover:text-[#D4C862]" href="/generate">Generate</Link>
              </nav>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t mt-12">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 text-sm text-[#3B523A]">
            © {new Date().getFullYear()} Root Work Framework — healing-centered, biophilic practice.
          </div>
        </footer>
      </body>
    </html>
  );
}

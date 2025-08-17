// ============================================
// FILE: src/app/page.tsx
// Landing Page
// ============================================
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-growth-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-growth-green-900 mb-6">
            Lesson Plans Rooted in 
            <span className="text-bloom-accent-500"> Equity</span>
          </h1>
          
          <p className="text-xl text-earth-brown-700 mb-8 leading-relaxed">
            AI-powered lesson planning with the <strong>Root Work Framework</strong> and 
            <strong> Garden to Growth</strong> methodology. Every lesson is equity-first, 
            trauma-informed, and strength-based.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-growth-green-600 hover:bg-growth-green-700">
              <Link href="/auth/register">Start Growing</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/demo">See It In Action</Link>
            </Button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="garden-growth-card">
              <h3 className="root-work-heading text-xl mb-3">Root Work Framework</h3>
              <p className="text-earth-brown-600">
                Every lesson embeds equity-first, trauma-informed principles into the AI's conscience.
              </p>
            </div>
            
            <div className="garden-growth-card">
              <h3 className="root-work-heading text-xl mb-3">Garden to Growth</h3>
              <p className="text-earth-brown-600">
                Learning progressions that honor natural development from seed to harvest.
              </p>
            </div>
            
            <div className="garden-growth-card">
              <h3 className="root-work-heading text-xl mb-3">Compliance Built-In</h3>
              <p className="text-earth-brown-600">
                FERPA and IDEA considerations are automatic, not afterthoughts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

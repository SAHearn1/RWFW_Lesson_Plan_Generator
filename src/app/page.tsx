export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-emerald-900 mb-6">
            Lesson Plans Rooted in 
            <span className="text-orange-500"> Equity</span>
          </h1>
          
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            AI-powered lesson planning with the <strong>Root Work Framework</strong> and 
            <strong> Garden to Growth</strong> methodology. Every lesson is equity-first, 
            trauma-informed, and strength-based.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/generate"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Growing
            </a>
            <a 
              href="/generate"
              className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Generate Lesson Plan
            </a>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-emerald-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-900 mb-3">Root Work Framework</h3>
              <p className="text-gray-600">
                Every lesson embeds equity-first, trauma-informed principles into the AI's conscience.
              </p>
            </div>
            
            <div className="bg-white border border-emerald-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-900 mb-3">Garden to Growth</h3>
              <p className="text-gray-600">
                Learning progressions that honor natural development from seed to harvest.
              </p>
            </div>
            
            <div className="bg-white border border-emerald-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-900 mb-3">Compliance Built-In</h3>
              <p className="text-gray-600">
                FERPA and IDEA considerations are automatic, not afterthoughts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

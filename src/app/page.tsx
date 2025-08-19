// File: src/app/page.tsx
// Root Work Framework Homepage

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F2F4CA, #ffffff)' }}>
      {/* Header */}
      <header className="border-b border-gray-200 shadow-sm" style={{ backgroundColor: '#082A19' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#D4C862' }}>
                  <svg className="w-6 h-6" style={{ color: '#082A19' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 6.26L18 7L13.09 7.74L12 12L10.91 7.74L6 7L10.91 6.26L12 2ZM4 17L5.09 19.26L8 20L5.09 20.74L4 23L2.91 20.74L0 20L2.91 19.26L4 17ZM20 17L21.09 19.26L24 20L21.09 20.74L20 23L18.91 20.74L16 20L18.91 19.26L20 17Z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Root Work Platform</h1>
                  <p className="text-xs" style={{ color: '#D4C862' }}>Equity-Centered Learning Design</p>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="border-b-2 px-3 py-2 text-sm font-medium text-white" style={{ borderColor: '#D4C862' }}>Home</a>
              <a href="/getting-started" className="text-gray-300 hover:text-white font-medium transition-colors">Getting Started</a>
              <a href="/generate" className="text-gray-300 hover:text-white font-medium transition-colors">Generate</a>
              <a href="#" className="text-gray-300 hover:text-white font-medium transition-colors">Resources</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-5xl mx-auto">
          {/* Hero Section with Logo */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#082A19' }}>
              {/* Root Work Logo - using the circular design pattern from your images */}
              <svg className="w-24 h-24" style={{ color: '#D4C862' }} fill="currentColor" viewBox="0 0 100 100">
                {/* Simplified version of your logo design */}
                <g>
                  {/* Central plant/sprout */}
                  <path d="M50 65 L50 45 L45 40 L50 35 L55 40 L50 45 M45 50 L40 45 M55 50 L60 45 M45 55 L40 60 M55 55 L60 60" stroke="currentColor" strokeWidth="2" fill="none"/>
                  {/* Scales of justice */}
                  <g transform="translate(25,25)">
                    <rect x="8" y="0" width="1" height="15" fill="currentColor"/>
                    <ellipse cx="4" cy="12" rx="4" ry="2" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <ellipse cx="12" cy="12" rx="4" ry="2" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <line x1="8" y1="8" x2="4" y2="10" stroke="currentColor" strokeWidth="1"/>
                    <line x1="8" y1="8" x2="12" y2="10" stroke="currentColor" strokeWidth="1"/>
                  </g>
                  {/* Book */}
                  <g transform="translate(65,25)">
                    <rect x="0" y="5" width="12" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <line x1="3" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="0.5"/>
                    <line x1="3" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="0.5"/>
                    <line x1="3" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="0.5"/>
                  </g>
                  {/* Brain */}
                  <g transform="translate(20,65)">
                    <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <path d="M3 6 Q6 3 9 6 Q6 9 3 6" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </g>
                  {/* Beaker */}
                  <g transform="translate(70,65)">
                    <path d="M4 2 L4 6 L2 10 L10 10 L8 6 L8 2 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <line x1="4" y1="2" x2="8" y2="2" stroke="currentColor" strokeWidth="1"/>
                    <circle cx="6" cy="8" r="1" fill="currentColor"/>
                  </g>
                  {/* Decorative flourishes */}
                  <path d="M30 50 Q35 45 40 50 Q35 55 30 50" fill="none" stroke="currentColor" strokeWidth="1"/>
                  <path d="M70 50 Q65 45 60 50 Q65 55 70 50" fill="none" stroke="currentColor" strokeWidth="1"/>
                </g>
              </svg>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{ color: '#082A19', fontFamily: 'Merriweather, Georgia, serif' }}>
              Lesson Plans Rooted in 
              <span style={{ color: '#D4C862' }}> Equity</span>
            </h1>
          </div>
          
          <p className="text-xl mb-12 leading-relaxed" style={{ color: '#2B2B2B' }}>
            Professional lesson planning powered by the <strong>Root Work Framework</strong> and 
            <strong> Garden to Growth</strong> methodology. Every lesson is equity-first, 
            trauma-informed, strength-based, and community-connected.
          </p>
          
          {/* Different User Journeys */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <a 
              href="/getting-started"
              className="text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:opacity-90 transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #082A19 0%, #3B523A 100%)' }}
            >
              Start Growing
              <p className="text-sm opacity-90 mt-1">Learn the Root Work approach</p>
            </a>
            <a 
              href="/generate"
              className="border-2 px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:opacity-90 transform hover:scale-105"
              style={{ 
                borderColor: '#082A19', 
                color: '#082A19',
                backgroundColor: 'rgba(242, 244, 202, 0.5)'
              }}
            >
              Generate Lesson Plan
              <p className="text-sm opacity-80 mt-1">Jump straight to creation</p>
            </a>
          </div>
          
          {/* Framework Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-lg p-8 shadow-sm border-2 transition-all hover:shadow-lg" style={{ borderColor: '#D4C862' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F2F4CA' }}>
                <svg className="w-8 h-8" style={{ color: '#082A19' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 6.26L18 7L13.09 7.74L12 12L10.91 7.74L6 7L10.91 6.26L12 2Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#082A19', fontFamily: 'Merriweather, Georgia, serif' }}>Root Work Framework</h3>
              <p style={{ color: '#2B2B2B' }}>
                Every lesson embeds equity-first, trauma-informed principles that honor student strengths and community assets.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-sm border-2 transition-all hover:shadow-lg" style={{ borderColor: '#D4C862' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F2F4CA' }}>
                <svg className="w-8 h-8" style={{ color: '#082A19' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11,2V22C5.9,21.5 2,17.2 2,12S5.9,2.5 11,2M13,2V22C18.1,21.

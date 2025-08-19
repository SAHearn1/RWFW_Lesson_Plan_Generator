export default function GettingStartedPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F2F4CA' }}>
      {/* Header */}
      <header className="border-b border-gray-200 shadow-sm" style={{ backgroundColor: '#082A19' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#D4C862' }}>
                  <svg className="w-6 h-6" style={{ color: '#082A19' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 6.26L18 7L13.09 7.74L12 12L10.91 7.74L6 7L10.91 6.26L12 2Z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Root Work Platform</h1>
                  <p className="text-xs" style={{ color: '#D4C862' }}>Equity-Centered Learning Design</p>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-300 hover:text-white font-medium transition-colors">Home</a>
              <a href="/getting-started" className="border-b-2 px-3 py-2 text-sm font-medium text-white" style={{ borderColor: '#D4C862' }}>Getting Started</a>
              <a href="/generate" className="text-gray-300 hover:text-white font-medium transition-colors">Generate</a>
              <a href="#" className="text-gray-300 hover:text-white font-medium transition-colors">Resources</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#082A19', fontFamily: 'Merriweather, Georgia, serif' }}>
            Start Growing with Root Work
          </h1>
          <p className="text-xl mb-8" style={{ color: '#2B2B2B' }}>
            Learn how to create equity-centered, trauma-informed lesson plans that honor student strengths and build community connections.
          </p>
        </div>

        {/* What is Root Work Framework */}
        <section className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2" style={{ borderColor: '#3B523A' }}>
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#082A19', fontFamily: 'Merriweather, Georgia, serif' }}>
              What is the Root Work Framework?
            </h2>
            <p className="text-lg mb-6" style={{ color: '#2B2B2B' }}>
              Root Work Framework is a dual-purpose pedagogy that weaves academic rigor with healing-centered, biophilic practice. It's grounded in four foundational principles that transform how we approach education.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#F2F4CA' }}>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#082A19' }}>1. Equity First</h3>
                <p style={{ color: '#2B2B2B' }}>
                  We begin by identifying and dismantling barriers that prevent students from accessing learning. Every lesson centers marginalized voices and experiences.
                </p>
              </div>
              
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#F2F4CA' }}>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#082A19' }}>2. Trauma Informed</h3>
                <p style={{ color: '#2B2B2B' }}>
                  Learning environments are designed to be safe, predictable, and healing. We recognize how trauma impacts learning and build in supports.
                </p>
              </div>
              
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#F2F4CA' }}>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#082A19' }}>3. Strength Based</h3>
                <p style={{ color: '#2B2B2B' }}>
                  Instead of deficit thinking, we build on the cultural wealth, knowledge, and assets that students and communities bring to learning.
                </p>
              </div>
              
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#F2F4CA' }}>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#082A19' }}>4. Community Connected</h3>
                <p style={{ color: '#2B2B2B' }}>
                  Learning connects to students' lived experiences, families, and communities. Education serves the broader goal of community well-being.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Garden to Growth Model */}
        <section className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2" style={{ borderColor: '#3B523A' }}>
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#082A19', fontFamily: 'Merriweather, Georgia, serif' }}>
              Garden to Growth: The 4E Model
            </h2>
            <p className="text-lg mb-8" style={{ color: '#2B2B2B' }}>
              Our lesson structure follows a natural learning progression, like tending a garden from seed to harvest.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4C862' }}>
                  <span className="text-2xl font-bold" style={{ color: '#082A19' }}>E</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-3" style={{ color: '#082A19' }}>ENGAGE (10-15 minutes)</h3>
                  <p className="text-lg mb-2" style={{ color: '#2B2B2B' }}><strong>Root Work Community Circle/Opening</strong></p>
                  <p style={{ color: '#2B2B2B' }}>
                    Build relationships and create psychological safety. Activate cultural assets and connect to prior knowledge through trauma-informed practices.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4C862' }}>
                  <span className="text-2xl font-bold" style={{ color: '#082A19' }}>E</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-3" style={{ color: '#082A19' }}>EXPLORE (15-20 minutes)</h3>
                  <p className="text-lg mb-2" style={{ color: '#2B2B2B' }}><strong>Root Work Strength-Based Direct Instruction</strong></p>
                  <p style={{ color: '#2B2B2B' }}>
                    Teacher modeling with cultural responsiveness. Direct instruction builds on community knowledge and honors diverse ways of knowing.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4C862' }}>
                  <span className="text-2xl font-bold" style={{ color: '#082A19' }}>A</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-3" style={{ color: '#082A19' }}>APPLY (25-40 minutes)</h3>
                  <p className="text-lg mb-2" style={{ color: '#2B2B2B' }}><strong>Root Work Collaborative & Individual Practice</strong></p>
                  <p style={{ color: '#2B2B2B' }}>
                    "We do" collaborative practice with peer support, then "You do" independent practice with choice and voice. Multiple ways to demonstrate understanding.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4C862' }}>
                  <span className="text-2xl font-bold" style={{ color: '#082A19' }}>R</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-3" style={{ color: '#082A19' }}>REFLECT (5-10 minutes)</h3>
                  <p className="text-lg mb-2" style={{ color: '#2B2B2B' }}><strong>Root Work Community Sharing & Closure</strong></p>
                  <p style={{ color: '#2B2B2B' }}>
                    Check for understanding through community dialogue. Student self-reflection, goal setting, and celebration of learning and cultural contributions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Use the Generator */}
        <section className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2" style={{ borderColor: '#3B523A' }}>
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#082A19', fontFamily: 'Merriweather, Georgia, serif' }}>
              How to Use the Lesson Plan Generator
            </h2>
            
            <div className="space-y-6">
              <div className="border-l-4 pl-6" style={{ borderColor: '#D4C862' }}>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#082A19' }}>Step 1: Choose Your Subjects</h3>
                <p style={{ color: '#2B2B2B' }}>
                  Select one or more subject areas. The generator excels at creating interdisciplinary lessons that connect learning across content areas.
                </p>
              </div>
              
              <div className="border-l-4 pl-6" style={{ borderColor: '#D4C862' }}>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#082A19' }}>Step 2: Specify Your Context</h3>
                <p style={{ color: '#2B2B2B' }}>
                  Include grade level, duration (1-20 days), and any standards you need to address. Don't worry if you leave some fields blank - the AI will intelligently fill in appropriate content.
                </p>
              </div>
              
              <div className="border-l-4 pl-6" style={{ borderColor: '#D4C862' }}>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#082A19' }}>Step 3: Describe Your Students</h3>
                <p style={{ color: '#2B2B2B' }}>
                  Share learning objectives and any special considerations. Mention cultural backgrounds, languages spoken, or specific needs to ensure lessons are truly responsive.
                </p>
              </div>
              
              <div className="border-l-4 pl-6" style={{ borderColor: '#D4C862' }}>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#082A19' }}>Step 4: Generate and Customize</h3>
                <p style={{ color: '#2B2B2B' }}>
                  Watch the progress bar as Root Work principles are woven into your lesson. The result includes working resource links, assessment strategies, and accommodations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-16">
          <div className="rounded-xl p-8 text-white" style={{ background: 'linear-gradient(135deg, #082A19 0%, #3B523A 100%)' }}>
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
              Best Practices for Root Work Lessons
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#D4C862' }}>Cultural Responsiveness</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Include student and family cultural knowledge in lessons</li>
                  <li>• Use diverse examples and representation in materials</li>
                  <li>• Connect learning to community issues and solutions</li>
                  <li>• Honor multiple languages and communication styles</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#D4C862' }}>Trauma-Informed Practice</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Establish clear, consistent routines and expectations</li>
                  <li>• Offer choice and voice in learning activities</li>
                  <li>• Build in brain breaks and regulation strategies</li>
                  <li>• Focus on growth and effort over perfection</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#D4C862' }}>Strength-Based Approach</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Start with what students know and can do</li>
                  <li>• Celebrate cultural and linguistic diversity as assets</li>
                  <li>• Use assets-based language in lesson descriptions</li>
                  <li>• Connect new learning to students' experiences</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#D4C862' }}>Community Connection</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Invite community members as expert voices</li>
                  <li>• Connect learning to local issues and solutions</li>
                  <li>• Include opportunities for family engagement</li>
                  <li>• Design authentic, real-world applications</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Ready to Start */}
        <section className="text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2" style={{ borderColor: '#3B523A' }}>
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#082A19', fontFamily: 'Merriweather, Georgia, serif' }}>
              Ready to Start Growing?
            </h2>
            <p className="text-lg mb-8" style={{ color: '#2B2B2B' }}>
              Now that you understand the Root Work Framework and Garden to Growth model, you're ready to create your first equity-centered lesson plan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/generate"
                className="text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #082A19 0%, #3B523A 100%)' }}
              >
                Create Your First Lesson Plan
              </a>
              <a 
                href="#"
                className="border-2 px-8 py-3 rounded-lg font-semibold text-lg transition-all hover:opacity-90"
                style={{ 
                  borderColor: '#082A19', 
                  color: '#082A19',
                  backgroundColor: '#F2F4CA'
                }}
              >
                Download Quick Reference Guide
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

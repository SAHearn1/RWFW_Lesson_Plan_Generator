// File: src/app/page.tsx
import { BookOpen, Target, Clock, Users, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F2F4CA, #ffffff)' }}>
      {/* Header */}
      <header className="border-b border-gray-200 shadow-sm" style={{ backgroundColor: '#082A19' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Root Work Framework</h1>
                <p className="text-emerald-100 text-sm">AI-Powered Lesson Planning</p>
              </div>
            </div>
            <nav className="flex items-center space-x-6">
              <a
                href="/getting-started"
                className="text-emerald-100 hover:text-white transition-colors"
              >
                Getting Started
              </a>
              <a
                href="/generate"
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Generate Lesson
              </a>
              {/* Root Work Framework Logo - Brand Compliant */}
              <div className="w-14 h-14 rounded-full border-2 border-emerald-100 p-1 flex-shrink-0" style={{ backgroundColor: '#082A19' }}>
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Background Circle - Evergreen */}
                  <circle cx="50" cy="50" r="48" fill="#082A19" stroke="#D4C862" strokeWidth="2"/>
                  
                  {/* Central Plant */}
                  <g transform="translate(50,50)">
                    {/* Plant stem - Gold Leaf */}
                    <path d="M0,-15 L0,15" stroke="#D4C862" strokeWidth="3" fill="none"/>
                    {/* Central leaves - Leaf color */}
                    <path d="M-8,-5 Q-12,-8 -8,-12 Q-4,-8 0,-5" fill="#3B523A"/>
                    <path d="M8,-5 Q12,-8 8,-12 Q4,-8 0,-5" fill="#3B523A"/>
                    <path d="M-6,5 Q-10,2 -6,-2 Q-2,2 0,5" fill="#3B523A"/>
                    <path d="M6,5 Q10,2 6,-2 Q2,2 0,5" fill="#3B523A"/>
                    
                    {/* Radiating lines - Gold Leaf */}
                    <g stroke="#D4C862" strokeWidth="1.5">
                      <path d="M-12,0 L-8,0"/>
                      <path d="M8,0 L12,0"/>
                      <path d="M0,-12 L0,-8"/>
                      <path d="M0,8 L0,12"/>
                      <path d="M-8,-8 L-6,-6"/>
                      <path d="M8,-8 L6,-6"/>
                      <path d="M-8,8 L-6,6"/>
                      <path d="M8,8 L6,6"/>
                    </g>
                  </g>
                  
                  {/* Scales of Justice - Upper Left - Gold Leaf */}
                  <g transform="translate(25,25) scale(0.7)">
                    <path d="M0,-8 L0,8" stroke="#D4C862" strokeWidth="2"/>
                    <path d="M-8,0 L8,0" stroke="#D4C862" strokeWidth="1.5"/>
                    <ellipse cx="-6" cy="4" rx="4" ry="2" fill="none" stroke="#D4C862" strokeWidth="1.5"/>
                    <ellipse cx="6" cy="4" rx="4" ry="2" fill="none" stroke="#D4C862" strokeWidth="1.5"/>
                  </g>
                  
                  {/* Book - Upper Right - Gold Leaf */}
                  <g transform="translate(75,25) scale(0.7)">
                    <rect x="-6" y="-4" width="12" height="8" fill="none" stroke="#D4C862" strokeWidth="2"/>
                    <path d="M-6,-4 L6,-4 L6,4 L-6,4 Z" fill="none" stroke="#D4C862" strokeWidth="1"/>
                    <path d="M0,-4 L0,4" stroke="#D4C862" strokeWidth="1.5"/>
                    <path d="M-3,-1 L3,-1" stroke="#D4C862" strokeWidth="1"/>
                    <path d="M-3,1 L3,1" stroke="#D4C862" strokeWidth="1"/>
                  </g>
                  
                  {/* Brain - Lower Left - Gold Leaf */}
                  <g transform="translate(25,75) scale(0.7)">
                    <path d="M-6,-4 Q-8,-6 -4,-6 Q0,-8 4,-6 Q8,-6 6,-4 Q8,-2 6,0 Q8,2 6,4 Q4,6 0,4 Q-4,6 -6,4 Q-8,2 -6,0 Q-8,-2 -6,-4" 
                          fill="none" stroke="#D4C862" strokeWidth="2"/>
                    <path d="M-2,-2 Q0,-4 2,-2" stroke="#D4C862" strokeWidth="1.2" fill="none"/>
                    <path d="M-2,2 Q0,0 2,2" stroke="#D4C862" strokeWidth="1.2" fill="none"/>
                  </g>
                  
                  {/* Science Flask - Lower Right - Gold Leaf */}
                  <g transform="translate(75,75) scale(0.7)">
                    <path d="M-2,-6 L-2,-2 L-6,4 L6,4 L2,-2 L2,-6" fill="none" stroke="#D4C862" strokeWidth="2"/>
                    <circle cx="0" cy="2" r="1.5" fill="#D4C862"/>
                    <path d="M-4,-6 L4,-6" stroke="#D4C862" strokeWidth="1.5"/>
                  </g>
                  
                  {/* Decorative vines - Leaf color */}
                  <g fill="none" stroke="#3B523A" strokeWidth="1.5">
                    <path d="M15,35 Q20,30 25,35 Q30,40 35,35"/>
                    <path d="M65,35 Q70,30 75,35 Q80,40 85,35"/>
                    <path d="M15,65 Q20,70 25,65 Q30,60 35,65"/>
                    <path d="M65,65 Q70,70 75,65 Q80,60 85,65"/>
                  </g>
                  
                  {/* Small leaves on vines - Leaf color */}
                  <g fill="#3B523A">
                    <ellipse cx="20" cy="32" rx="2.5" ry="1.2" transform="rotate(45 20 32)"/>
                    <ellipse cx="30" cy="38" rx="2.5" ry="1.2" transform="rotate(-45 30 38)"/>
                    <ellipse cx="70" cy="32" rx="2.5" ry="1.2" transform="rotate(-45 70 32)"/>
                    <ellipse cx="80" cy="38" rx="2.5" ry="1.2" transform="rotate(45 80 38)"/>
                    <ellipse cx="20" cy="68" rx="2.5" ry="1.2" transform="rotate(-45 20 68)"/>
                    <ellipse cx="30" cy="62" rx="2.5" ry="1.2" transform="rotate(45 30 62)"/>
                    <ellipse cx="70" cy="68" rx="2.5" ry="1.2" transform="rotate(45 70 68)"/>
                    <ellipse cx="80" cy="62" rx="2.5" ry="1.2" transform="rotate(-45 80 62)"/>
                  </g>
                </svg>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Transform Your Teaching with
              <span className="text-emerald-600 block">Root Work Framework</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A trauma-informed, regenerative learning ecosystem that integrates project-based STEAM education, 
              culturally responsive pedagogy, and place-based learning. Designed by Dr. S.A. Hearn for 
              urban schools and community transformation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/generate"
                className="bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Creating Lessons
              </a>
              <a
                href="/getting-started"
                className="border border-emerald-600 text-emerald-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-emerald-50 transition-colors flex items-center justify-center"
              >
                Learn How It Works
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trauma-Informed, Regenerative Learning Ecosystem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Root Work Framework integrates SAMHSA trauma-informed principles, CASEL SEL competencies, 
              and regenerative agriculture into comprehensive Living Learning Labs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Trauma-Informed Care</h3>
              <p className="text-gray-600">
                Lessons embed SAMHSA's six principles: safety, trustworthiness, peer support, 
                collaboration, empowerment, and cultural responsiveness.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Place-Based STEAM</h3>
              <p className="text-gray-600">
                Project-based learning through regenerative urban homesteading, 
                integrating science, technology, engineering, arts, and mathematics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cultural Responsiveness</h3>
              <p className="text-gray-600">
                Culturally responsive pedagogy that honors student backgrounds while 
                building intergenerational stewardship and community connections.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Living Learning Labs</h3>
              <p className="text-gray-600">
                Evidence-based practices creating hubs for healing, learning, innovation, 
                and community transformation through regenerative systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20" style={{ backgroundColor: '#f8fffe' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Three Simple Steps to Better Lessons
            </h2>
            <p className="text-xl text-gray-600">
              Professional-quality lesson plans in just a few clicks
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center relative">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Input Your Requirements</h3>
              <p className="text-gray-600">
                Tell us your subject, grade level, topic, and learning objectives. 
                Add any special considerations for your students.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center relative">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Creates Your Plan</h3>
              <p className="text-gray-600">
                Our intelligent system generates a comprehensive lesson plan with 
                activities, timelines, assessments, and differentiation strategies.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center relative">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customize & Teach</h3>
              <p className="text-gray-600">
                Review, customize, and download your lesson plan. Ready to use 
                in your classroom immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Revolutionize Your Teaching?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of educators who are saving time and creating 
            better learning experiences with Root Work Framework.
          </p>
          <a
            href="/generate"
            className="bg-white text-emerald-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Generate Your First Lesson Plan
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Root Work Framework</span>
              </div>
              <p className="text-gray-400">
                Developed by Dr. S.A. Hearn through Community Exceptional Children's Services (CECSC). 
                A trauma-informed, regenerative learning ecosystem for urban schools and communities.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/generate" className="text-gray-400 hover:text-white transition-colors">Generate Lesson</a></li>
                <li><a href="/getting-started" className="text-gray-400 hover:text-white transition-colors">Getting Started</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Research Foundation</h3>
              <p className="text-gray-400">
                Grounded in SAMHSA trauma-informed principles, CASEL SEL competencies, 
                and USDA regenerative agriculture guidelines. Evidence-based practices 
                for community transformation.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Root Work Framework. Designed for educational excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

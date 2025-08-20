// src/app/page.tsx - Root Work Framework Landing Page

'use client';

import Link from 'next/link';

export default function RootWorkFrameworkLanding() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Root Work Framework</h1>
                <p className="text-emerald-200 text-sm">AI-Powered Lesson Planning</p>
              </div>
            </div>
            <nav className="flex items-center space-x-6">
              <Link 
                href="#how-it-works" 
                className="text-emerald-200 hover:text-white transition-colors"
              >
                Getting Started
              </Link>
              <Link 
                href="/generate" 
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Generate Lesson
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-yellow-50 to-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Teaching with{' '}
            <span className="text-emerald-600">Root Work Framework</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            A trauma-informed, regenerative learning ecosystem that integrates project-based 
            STEAM education, culturally responsive pedagogy, and place-based learning. 
            Designed by Dr. S.A. Hearn for urban schools and community transformation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/generate"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Start Creating Lessons
            </Link>
            <Link 
              href="#how-it-works"
              className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              Learn How It Works
              <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Trauma-Informed, Regenerative Learning Ecosystem
          </h3>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-4xl mx-auto">
            Root Work Framework integrates SAMHSA trauma-informed principles, CASEL 
            SEL competencies, and regenerative agriculture into comprehensive Living 
            Learning Labs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Trauma-Informed Care */}
            <div className="text-center">
              <div className="bg-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Trauma-Informed Care</h4>
              <p className="text-gray-600 leading-relaxed">
                Lessons embed SAMHSA's six principles: safety, trustworthiness, 
                peer support, collaboration, empowerment, and cultural responsiveness.
              </p>
            </div>

            {/* Place-Based STEAM */}
            <div className="text-center">
              <div className="bg-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Place-Based STEAM</h4>
              <p className="text-gray-600 leading-relaxed">
                Project-based learning through regenerative urban homesteading, 
                integrating science, technology, engineering, arts, and mathematics.
              </p>
            </div>

            {/* Cultural Responsiveness */}
            <div className="text-center">
              <div className="bg-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Cultural Responsiveness</h4>
              <p className="text-gray-600 leading-relaxed">
                Culturally responsive pedagogy that honors student backgrounds while 
                building intergenerational stewardship and community connections.
              </p>
            </div>

            {/* Living Learning Labs */}
            <div className="text-center">
              <div className="bg-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Living Learning Labs</h4>
              <p className="text-gray-600 leading-relaxed">
                Evidence-based practices creating hubs for healing, learning, 
                innovation, and community transformation through regenerative systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">
            How Root Work Framework Works
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                1
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Input Your Requirements</h4>
              <p className="text-gray-600">
                Specify your subject, grade level, topic, and duration. Add any special 
                considerations for your students and available resources.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                2
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">AI Generates Framework-Based Lessons</h4>
              <p className="text-gray-600">
                Our AI creates comprehensive lesson plans using the 5 Rs (Relationships, 
                Routines, Relevance, Rigor, Reflection) with built-in trauma-informed practices.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                3
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Implement & Transform</h4>
              <p className="text-gray-600">
                Receive detailed lesson plans with MTSS supports, co-teaching strategies, 
                and community-centered approaches ready for immediate classroom use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Transform Your Teaching Practice?
          </h3>
          <p className="text-xl mb-8 text-emerald-100">
            Join educators creating trauma-informed, culturally responsive learning 
            experiences that honor student backgrounds and build community connections.
          </p>
          <Link 
            href="/generate"
            className="bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Create Your First Lesson Plan
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Root Work Framework</h4>
              <p className="text-gray-400">
                Transforming education through trauma-informed, regenerative learning 
                ecosystems designed for urban schools and community transformation.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Framework Elements</h4>
              <ul className="space-y-2 text-gray-400">
                <li>The 5 Rs Structure</li>
                <li>SAMHSA Trauma-Informed Principles</li>
                <li>CASEL SEL Competencies</li>
                <li>Place-Based STEAM Integration</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">About</h4>
              <p className="text-gray-400">
                Developed by Dr. S.A. Hearn, combining expertise in education law, 
                special education, trauma-informed care, and regenerative practices.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Root Work Framework. Designed for educational transformation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

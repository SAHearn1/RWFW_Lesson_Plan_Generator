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
              Create comprehensive, standards-aligned lesson plans in minutes with our 
              AI-powered platform. Designed by educators, for educators.
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
              Everything You Need for Effective Teaching
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Root Work Framework combines educational expertise with AI technology 
              to deliver comprehensive lesson planning solutions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Standards Aligned</h3>
              <p className="text-gray-600">
                Every lesson plan aligns with educational standards and grade-level expectations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Time Efficient</h3>
              <p className="text-gray-600">
                Generate comprehensive lesson plans in minutes, not hours of planning time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Differentiated</h3>
              <p className="text-gray-600">
                Built-in strategies for diverse learners, including special education support.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Assessment Ready</h3>
              <p className="text-gray-600">
                Includes formative and summative assessment strategies for every lesson.
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
                Empowering educators with AI-powered lesson planning tools 
                that save time and enhance student learning.
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
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <p className="text-gray-400">
                Built by educators for educators, Root Work Framework combines 
                pedagogical expertise with cutting-edge AI technology.
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

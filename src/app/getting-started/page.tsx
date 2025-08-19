// File: src/app/getting-started/page.tsx
import { BookOpen, Target, Clock, Users, CheckCircle, ArrowRight, Lightbulb, FileText, Download } from 'lucide-react';

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F2F4CA, #ffffff)' }}>
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Root Work Framework</h1>
                <p className="text-sm text-gray-600">Getting Started Guide</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/generate"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Generate Lesson
              </a>
              <a
                href="/"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Root Work Framework
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your comprehensive AI-powered lesson planning tool designed to create engaging, 
            standards-aligned educational experiences for every classroom.
          </p>
        </div>

        {/* What is Root Work */}
        <section className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Lightbulb className="h-6 w-6 text-emerald-600 mr-2" />
              What is Root Work Framework?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-4">
                  Root Work Framework is an innovative lesson planning platform that combines 
                  educational best practices with AI technology to help teachers create 
                  comprehensive, engaging lesson plans in minutes rather than hours.
                </p>
                <p className="text-gray-600">
                  Built on research-based pedagogical principles and designed for compliance 
                  with educational standards, Root Work ensures every lesson plan meets 
                  professional teaching requirements while saving valuable preparation time.
                </p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Key Benefits:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                    Standards-aligned content
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                    Differentiation strategies included
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                    Assessment tools integrated
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                    Time-efficient planning
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How to Use */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How to Create Your First Lesson Plan
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-emerald-600 font-bold text-lg">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Input Your Requirements</h3>
              <p className="text-gray-600 text-sm">
                Provide basic information about your lesson: subject, grade level, topic, 
                duration, and learning objectives.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-emerald-600 font-bold text-lg">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Generates Your Plan</h3>
              <p className="text-gray-600 text-sm">
                Our AI analyzes your inputs and creates a comprehensive lesson plan 
                with activities, timelines, and assessments.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-emerald-600 font-bold text-lg">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Customize & Implement</h3>
              <p className="text-gray-600 text-sm">
                Review, customize, and download your lesson plan. Ready to use in 
                your classroom immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Features Deep Dive */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Comprehensive Lesson Plan Components
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 text-emerald-600 mr-2" />
                Learning Objectives & Standards
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Every lesson plan includes clear, measurable learning objectives aligned 
                with educational standards and appropriate for your specified grade level.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bloom's Taxonomy alignment</li>
                <li>• Grade-appropriate language</li>
                <li>• Measurable outcomes</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 text-emerald-600 mr-2" />
                Detailed Timeline & Activities
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Structured timelines with specific activities, ensuring optimal pacing 
                and engagement throughout your lesson duration.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Warm-up activities</li>
                <li>• Main instructional segments</li>
                <li>• Closure and reflection</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 text-emerald-600 mr-2" />
                Differentiation Strategies
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Built-in strategies to accommodate diverse learning needs, including 
                special education considerations and English language learners.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multiple learning modalities</li>
                <li>• Scaffolding techniques</li>
                <li>• Extension activities</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                Assessment & Evaluation
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Comprehensive assessment strategies including formative and summative 
                evaluation methods to measure student understanding.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Formative assessment tools</li>
                <li>• Performance indicators</li>
                <li>• Rubric suggestions</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Tips for Maximum Effectiveness
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Before Creating Your Lesson:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Review your curriculum standards and pacing guide</li>
                  <li>• Consider your students' prior knowledge and needs</li>
                  <li>• Identify available resources and materials</li>
                  <li>• Think about learning objectives in specific, measurable terms</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">After Generating Your Plan:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Review and customize content for your specific classroom</li>
                  <li>• Adjust timing based on your students' pace</li>
                  <li>• Add personal touches and examples</li>
                  <li>• Prepare materials and resources in advance</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Lesson Planning?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of educators who are saving time and creating better 
              learning experiences with Root Work Framework.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/generate"
                className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center"
              >
                <FileText className="h-5 w-5 mr-2" />
                Generate Your First Lesson
              </a>
              
              <a
                href="/"
                className="border border-emerald-600 text-emerald-600 px-8 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors flex items-center justify-center"
              >
                Learn More
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

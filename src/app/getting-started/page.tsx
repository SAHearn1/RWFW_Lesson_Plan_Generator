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
            A trauma-informed, regenerative learning ecosystem developed by Dr. S.A. Hearn 
            that creates engaging, culturally responsive educational experiences through 
            Living Learning Labs and community-centered pedagogy.
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
                  Root Work Framework is a comprehensive educational approach developed by 
                  Dr. S.A. Hearn that integrates trauma-informed care, regenerative urban 
                  homesteading, culturally responsive pedagogy, and project-based STEAM 
                  education into unified Living Learning Labs.
                </p>
                <p className="text-gray-600 mb-4">
                  Grounded in SAMHSA's trauma-informed principles, CASEL's SEL competencies, 
                  and USDA regenerative agriculture guidelines, this framework addresses 
                  the needs of urban youth impacted by intergenerational trauma and 
                  systemic inequities.
                </p>
                <p className="text-gray-600">
                  Each lesson plan created through this platform embeds evidence-based 
                  practices for community transformation, healing, and environmental stewardship.
                </p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Research Foundation:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                    SAMHSA Trauma-Informed Principles
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                    CASEL SEL Competencies
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                    MTSS and UDL Principles
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                    Place-based STEAM Education
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
                    Regenerative Agriculture Guidelines
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
            Root Work Framework Components
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 text-emerald-600 mr-2" />
                Trauma-Informed Care Integration
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Every lesson incorporates SAMHSA's six principles: safety, trustworthiness, 
                peer support, collaboration, empowerment, and cultural responsiveness to 
                create psychologically safe learning environments.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Community circles and restorative practices</li>
                <li>• Student agency and choice in learning</li>
                <li>• Culturally responsive teaching methods</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 text-emerald-600 mr-2" />
                Place-Based STEAM Learning
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Project-based learning through regenerative urban homesteading that 
                integrates science, technology, engineering, arts, and mathematics 
                with environmental stewardship.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Living Learning Labs (LLLs)</li>
                <li>• Community-connected projects</li>
                <li>• Environmental justice focus</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 text-emerald-600 mr-2" />
                Social-Emotional Learning (SEL)
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                CASEL competencies embedded throughout lessons including emotional 
                regulation, relationship building, and responsible decision-making 
                through authentic, community-centered activities.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Peer support and collaboration</li>
                <li>• Emotional regulation strategies</li>
                <li>• Community stewardship mindset</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                Culturally Responsive Assessment
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Assessment strategies that honor diverse ways of knowing and 
                expressing understanding, focusing on growth, community contribution, 
                and authentic demonstration of learning.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multiple modalities for expression</li>
                <li>• Asset-based evaluation approaches</li>
                <li>• Peer and self-reflection practices</li>
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

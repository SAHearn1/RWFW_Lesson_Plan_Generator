// File: src/app/page.tsx
'use client';

import React from 'react';

// A simple Icon component for the feature list
const CheckIcon = () => (
  <svg className="h-6 w-6 flex-none text-brand-leaf" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-canvas-light font-sans text-brand-charcoal">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <header className="text-center mb-12">
          <img
            src="/images/rwfw-logo-1.jpg"
            alt="Root Work Framework Logo"
            className="mx-auto h-28 w-28 rounded-full shadow-lg mb-6 border-4 border-white"
          />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-deep-canopy tracking-tight font-serif">
            Root Work Framework
          </h1>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto">
            Weaving academic rigor with healing-centered, biophilic practice.
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <div className="prose prose-lg max-w-none prose-h2:font-serif prose-h2:text-brand-evergreen">
            
            <h2 className="text-center">A New Approach to Lesson Planning</h2>
            <p>
              Welcome. This tool is more than a generator; it's a partner in curriculum design, built on the foundational principles of the Root Work Framework. Our approach encourages and supports authentic, interdisciplinary lesson planning by developing a **living document** that you can use as a robust starting point for collaboration and refinement.
            </p>
            <p>
              Every lesson is structured around the **5Rs**: a pedagogical sequence designed to foster a trauma-informed, healing-centered classroom environment.
            </p>
            <ul className="!my-8 space-y-4">
              <li className="flex items-start gap-4">
                <CheckIcon />
                <span><strong>Relationships:</strong> Fostering community and connection first.</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckIcon />
                <span><strong>Routines:</strong> Establishing predictability and safety.</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckIcon />
                <span><strong>Relevance:</strong> Connecting content to students' lived experiences.</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckIcon />
                <span><strong>Rigor:</strong> Engaging in deep, meaningful academic work.</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckIcon />
                <span><strong>Reflection:</strong> Solidifying learning through metacognition.</span>
              </li>
            </ul>

            <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
                <h2 className="!mt-0">User Guide & Best Practices</h2>
                <p>
                    To get the highest quality experience, think of this AI as your brilliant but sometimes overly enthusiastic co-planner. Here’s a quick cheat sheet for the best results:
                </p>
                <ol>
                    <li>
                        <strong>Use Natural Language:</strong> The "Standards Alignment" and "Learning Focus" fields are conversational. Don't just list codes; describe your goals. For example, instead of just "CCSS.ELA-LITERACY.W.9-10.3," try: <em>"Focus on W.9-10.3, especially helping students build narrative cohesion and use sensory details to create a vivid sense of place."</em>
                    </li>
                    <li>
                        <strong>Aim for the "Sweet Spot":</strong> Our testing shows that generating **1-3 days** at a time produces the most detailed, complete, and well-formatted lesson plans. For longer units, generate plans in 3-day chunks and combine them.
                    </li>
                    <li>
                        <strong>Always Review and Refine:</strong> The AI is a powerful tool for generating a first draft, but it is not a substitute for your professional expertise. Always review the generated content for accuracy, appropriateness, and potential "hallucinations" (plausible but incorrect information). The generated plan is your starting point, not your final product.
                    </li>
                </ol>
            </div>
            
            <div className="text-center mt-12">
              <a 
                href="/generator"
                className="inline-block bg-brand-evergreen text-white py-4 px-10 rounded-lg font-semibold hover:bg-brand-deep-canopy transition-all duration-300 shadow-lg hover:shadow-xl font-serif tracking-wide text-xl"
              >
                Begin Lesson Planning
              </a>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

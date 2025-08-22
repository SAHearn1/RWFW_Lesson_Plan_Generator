// File: src/app/page.tsx
'use client';

import React from 'react';

// --- Icon Components (from Lucide set, as per brand guide) ---
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 flex-none text-brand-leaf">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-brand-gold-leaf">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);

const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-brand-gold-leaf">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
        <path d="M9 18h6"></path><path d="M10 22h4"></path>
    </svg>
);

const ShieldCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-brand-gold-leaf">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
    </svg>
);


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-canvas-light font-sans text-brand-charcoal">
      <div className="relative isolate overflow-hidden bg-brand-evergreen">
        {/* --- Hero Section --- */}
        <div className="container mx-auto px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <img
              src="/images/rwfw-logo-1.jpg"
              alt="Root Work Framework Logo"
              className="mx-auto h-32 w-32 rounded-full shadow-2xl mb-8 border-4 border-white/50"
            />
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-serif">
              Root Work Framework
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
              A dual-purpose pedagogy that weaves academic rigor with healing-centered, biophilic practice. This platform is your partner in creating truly transformative learning experiences.
            </p>
            <div className="mt-10">
              <a 
                href="/generator"
                className="rounded-md bg-brand-gold-leaf px-8 py-4 text-lg font-semibold text-brand-deep-canopy shadow-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold-leaf transition-colors duration-300"
              >
                Begin Lesson Planning
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-24 max-w-5xl">
        <main className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
          <div className="prose prose-lg max-w-none prose-h2:font-serif prose-h2:text-brand-evergreen prose-h3:font-serif prose-h3:text-brand-leaf">
            
            <h2 className="text-center">The Philosophy Behind the Platform</h2>
            <p>
              This tool is more than a generator; it's a partner in curriculum design, built on the foundational principles of the Root Work Framework. Our approach encourages and supports authentic, interdisciplinary lesson planning by developing a <strong>living document</strong> that you can use as a robust starting point for collaboration and refinement.
            </p>
            <p>
              Every lesson is structured around the **5Rs**: a pedagogical sequence designed to foster a trauma-informed, healing-centered classroom environment.
            </p>
            <ul className="!my-10 space-y-6">
              <li className="flex items-start gap-4">
                <CheckCircleIcon />
                <div><strong>Relationships:</strong> Fostering community, connection, and psychological safety as the prerequisite for learning.</div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircleIcon />
                <div><strong>Routines:</strong> Establishing predictable structures, grounding rituals, and clear expectations to create a safe and efficient learning environment.</div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircleIcon />
                <div><strong>Relevance:</strong> Connecting academic content to students' lives, cultures, and lived experiences to foster authentic engagement.</div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircleIcon />
                <div><strong>Rigor:</strong> Engaging in deep, meaningful academic work that challenges students to think critically and creatively.</div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircleIcon />
                <div><strong>Reflection:</strong> Solidifying learning through metacognition, self-assessment, and the sharing of takeaways.</div>
              </li>
            </ul>

            <div className="mt-16 p-8 bg-brand-canvas-light rounded-xl border border-brand-leaf/50">
                <h2 className="!mt-0 text-center">A Quick Start Guide for Educators</h2>
                <p className="text-center">
                    To get the highest quality experience, think of this AI as your brilliant but sometimes overly enthusiastic co-planner. Here’s a cheat sheet for the best results:
                </p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col items-center">
                        <BookOpenIcon />
                        <h3 className="!mt-4">Use Natural Language</h3>
                        <p className="text-base">The "Standards" and "Focus" fields are conversational. Describe your goals. Instead of just "W.9-10.3," try: <em>"Focus on W.9-10.3, especially using sensory details to create a vivid sense of place."</em></p>
                    </div>
                    <div className="flex flex-col items-center">
                        <LightbulbIcon />
                        <h3 className="!mt-4">Aim for the Sweet Spot</h3>
                        <p className="text-base">Our testing shows that generating **1-3 days** at a time produces the most detailed and complete plans. For longer units, simply generate plans in 3-day chunks and combine them.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <ShieldCheckIcon />
                        <h3 className="!mt-4">Always Review & Refine</h3>
                        <p className="text-base">The AI is a powerful first-draft tool, not a substitute for your professional expertise. Always review the generated content for accuracy, appropriateness, and potential "hallucinations."</p>
                    </div>
                </div>
            </div>
            
            <div className="text-center mt-16">
              <a 
                href="/generator"
                className="inline-block bg-brand-evergreen text-white py-4 px-10 rounded-lg font-semibold hover:bg-brand-deep-canopy transition-all duration-300 shadow-lg hover:shadow-xl font-serif tracking-wide text-xl"
              >
                Get Started
              </a>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

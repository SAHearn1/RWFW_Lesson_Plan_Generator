// File: src/app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Use the new central config
import { masterPrompt } from '../masterPrompt';
import SignIn from '../components/SignIn'; // Import the new component

type Tab = 'generator' | 'results';
type Viewer = 'teacher' | 'student' | 'print';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  
  // Other state variables...
  const [tab, setTab] = useState<Tab>('generator');
  const [viewer, setViewer] = useState<Viewer>('teacher');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoaded(true); // Mark auth as loaded
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth).catch((error) => console.error('Sign Out Error', error));
  };
  
  // ... (keep all your other handler functions: handleSubjectChange, handleDownloadMarkdown, handleGeneratePlan, etc.)
  // IMPORTANT: You will need to re-enable the Firebase Admin code in your API route later for full security.

  const header = (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-purple-700" />
      <div className="relative container mx-auto px-6 py-14 text-white">
        <div className="flex justify-between items-center">
            <div></div> {/* Spacer */}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Healing-Centered Lesson Design
            </h1>
            {currentUser && (
                <button 
                  onClick={handleSignOut} 
                  className="bg-white/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/30 transition">
                  Sign Out
                </button>
            )}
        </div>
        <p className="mt-3 text-white/90 max-w-3xl mx-auto text-center">
            S.T.E.A.M. Powered, Trauma Informed, Project Based lesson planning for real classrooms.
        </p>
      </div>
    </header>
  );

  if (!authLoaded) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50">
      {header}
      <main className="container mx-auto px-6 -mt-10 pb-16">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 md:p-8">
          {!currentUser ? (
            <SignIn />
          ) : (
            // This is the generator form, only shown to logged-in users
            // The existing <form> and <div tab="results"> logic goes here...
            <form onSubmit={handleGeneratePlan}>
                {/* ... your entire form JSX ... */}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

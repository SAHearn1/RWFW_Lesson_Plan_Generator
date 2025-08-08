'use client';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
// …all the single block of imports…
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function HomePage() {
  // …your useState hooks…
    // 1) Load framework from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = loadFromLocalStorage('rootWorkFramework', rootWorkFramework);
    setRootWorkFramework(saved);
  }, []);

  // 2) Save framework when it changes
  useEffect(() => {
    saveToLocalStorage('rootWorkFramework', rootWorkFramework);
  }, [rootWorkFramework]);

  // 3) Firebase anonymous auth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!firebaseConfig.apiKey) {
      setError("Firebase configuration is missing. Please set it in your Vercel environment variables.");
      setView('form');
      return;
    }
    onAuthStateChanged(auth, (currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
        setView('form');
      } else {
        signInAnonymously(auth).catch(err => {
          console.error("Anonymous sign-in error:", err);
          setError("Could not sign in. Please try again later.");
        });
      }
    });
  }, []);


  // Navigation State
  const [activeTab, setActiveTab] = useState<'generator' | 'framework' | 'dashboard'>('generator');
  
  // Lesson Generator State
  const [view, setView] = useState<'loading' | 'form' | 'results'>('loading');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User & Usage State
  const [user, setUser] = useState<User | null>(null);
  const [usageInfo, setUsageInfo] = useState({ count: 0, limit: 5 });

  // Form State
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // Root Work Framework State
  const [rootWorkFramework, setRootWorkFramework] = useState<RootWorkFramework>({
    entries: [],
    metadata: { lastUpdated: new Date(), version: '1.0.0', createdBy: 'Root Work Framework User' }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RootWorkEntry['category'] | 'all'>('all');
  const [showEntryForm, setShowEntryForm] = useState(false);

  // New Entry Form State
  const [newEntry, setNewEntry] = useState<Partial<RootWorkEntry>>({
    title: '', description: '', category: 'educational',
    priority: 'medium', status: 'pending', tags: [], assignee: ''
  });


// --- Enhanced Main App Component ---
{
  // … your state hooks here …

  generateLessonPlan,
  formatDate,
  cn,
} from '@/lib/utils';

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// --- Enhanced Main App Component ---
export default function HomePage() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'generator' | 'framework' | 'dashboard'>('generator');
  
  // Original App State (Lesson Generator)
  const [view, setView] = useState('loading'); // loading, form, results
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User and Usage State
  const [user, setUser] = useState<User | null>(null);
  const [usageInfo, setUsageInfo] = useState({ count: 0, limit: 5 });

  // Original Form State
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // New Root Work Framework State
  const [rootWorkFramework, setRootWorkFramework] = useState<RootWorkFramework>({
    entries: [],
    metadata: {
      lastUpdated: new Date(),
      version: '1.0.0',
      createdBy: 'Root Work Framework User'
    }
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RootWorkEntry['category'] | 'all'>('all');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  
  // New Entry Form State
  const [newEntry, setNewEntry] = useState<Partial<RootWorkEntry>>({
    title: '',
    description: '',
    category: 'educational',
    priority: 'medium',
    status: 'pending',
    tags: [],
    assignee: ''
  });

  // 1) Load framework from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = loadFromLocalStorage('rootWorkFramework', rootWorkFramework);
    setRootWorkFramework(saved);
  }, []);

  // 2) Save framework when it changes
  useEffect(() => {
    saveToLocalStorage('rootWorkFramework', rootWorkFramework);
  }, [rootWorkFramework]);

  // 3) Firebase anonymous auth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!firebaseConfig.apiKey) {
      setError(
        "Firebase configuration is missing. Please set it in your Vercel environment variables."
      );
      setView('form');
      return;
    }
    onAuthStateChanged(auth, (currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
        setView('form');
      } else {
        signInAnonymously(auth).catch(err => {
          console.error("Anonymous sign-in error:", err);
          setError("Could not sign in. Please try again later.");
        });
      }
    });
  }, []);

  // --- Original Form Input Handlers ---
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = [...e.target.selectedOptions];
    const values = options.map(option => option.value);
    setSubjects(values);
  };

  // --- Root Work Framework Functions ---
  const addRootWorkEntry = () => {
    const errors = validateRootWorkEntry(newEntry);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    const entry: RootWorkEntry = {
      ...newEntry as RootWorkEntry,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      complianceFlags: checkComplianceFlags(newEntry as RootWorkEntry)
    };

    setRootWorkFramework(prev => ({
      ...prev,
      entries: [...prev.entries, entry],
      metadata: {
        ...prev.metadata,
        lastUpdated: new Date()
      }
    }));

    // Reset form
    setNewEntry({
      title: '',
      description: '',
      category: 'educational',
      priority: 'medium',
      status: 'pending',
      tags: [],
      assignee: ''
    });
    setShowEntryForm(false);
    setError(null);
  };

  const updateEntryStatus = (id: string, status: RootWorkEntry['status']) => {
    setRootWorkFramework(prev => ({
      ...prev,
      entries: prev.entries.map(entry => 
        entry.id === id 
          ? { ...entry, status, updatedAt: new Date() }
          : entry
      ),
      metadata: {
        ...prev.metadata,
        lastUpdated: new Date()
      }
    }));
  };

  const deleteEntry = (id: string) => {
    setRootWorkFramework(prev => ({
      ...prev,
      entries: prev.entries.filter(entry => entry.id !== id),
      metadata: {
        ...prev.metadata,
        lastUpdated: new Date()
      }
    }));
  };

  const exportFramework = () => {
    const csv = exportToCSV(rootWorkFramework.entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `root-work-framework-${formatDate(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // --- Original API Call to Backend Serverless Function ---
  const handleGeneratePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        setError("You are not signed in.");
        return;
    }
    if (!gradeLevel || subjects.length === 0) {
      setError('Please select a grade level and at least one subject.');
      return;
    }
    if (usageInfo.count >= usageInfo.limit) {
      setError(`You have reached your monthly limit of ${usageInfo.limit} lesson plans.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setView('loading');

    const prompt = `
      As an expert in curriculum design specializing in trauma-informed, healing-centered, and culturally responsive education, generate a comprehensive lesson plan using the "Rootwork Framework".
      **Lesson Details:**
      - **Grade Level:** ${gradeLevel}
      - **Subject Area(s):** ${subjects.join(', ')}
      - **Duration:** ${duration} days (90 minutes per day)
      - **Unit Title:** ${unitTitle || 'Rooted in Me: Exploring Culture, Identity, and Expression'}
      - **Standards Alignment Input:** ${standards || 'Please align with common core or relevant state standards.'}
      - **Additional Focus Areas (accommodations, therapeutic goals):** ${focus || 'None specified.'}
      **Required Framework Components (for each day):**
      1.  **Day Title & Essential Question:** A unique, thematic title and question for the day.
      2.  **Learning Target:** A student-friendly "I can..." statement.
      3.  **Standards Alignment:** Connect to relevant academic standards (e.g., CCSS, NGSS) and Social-Emotional Learning standards (CASEL).
      4.  **Trauma-Informed Design Elements:** Explicitly list how physical, psychological, emotional, and cultural safety are ensured.
      5.  **Structured Lesson Flow (90 mins):** Detail activities for Opening Ritual, I Do, We Do, You Do Together, You Do Alone, and Closing Circle, including Teacher and Student Notes.
      6.  **Assessment (Trauma-Informed & Strengths-Based):** Describe formative, diagnostic, and celebratory assessment methods.
      7.  **MTSS Tiered Supports:** Outline Universal (Tier 1), Targeted (Tier 2), and Intensive (Tier 3) supports.
      8.  **Extension and Enrichment:** Provide activities for advanced learners and family/community engagement.
      **Format the entire output in clean, well-structured Markdown.** Use headings, bold text, and lists. Do not include any introductory or concluding conversational text.
    `;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An unknown error occurred.');
      }
      
      setLessonPlan(data.lessonPlan);
      setUsageInfo(data.usageInfo);
      setView('results');

      // Automatically create a Root Work entry for this lesson plan
      const lessonEntry: RootWorkEntry = {
        id: generateId(),
        title: `Lesson Plan: ${unitTitle || 'Rooted in Me'}`,
        description: `${gradeLevel} ${subjects.join(', ')} lesson plan - ${duration} days`,
        category: 'educational',
        priority: 'medium',
        status: 'completed',
        tags: ['lesson-plan', 'rootwork-framework', ...subjects.map(s => s.toLowerCase().replace(/\s+/g, '-'))],
        assignee: 'Generated by AI',
        createdAt: new Date(),
        updatedAt: new Date(),
        complianceFlags: []
      };

      setRootWorkFramework(prev => ({
        ...prev,
        entries: [...prev.entries, lessonEntry],
        metadata: {
          ...prev.metadata,
          lastUpdated: new Date()
        }
      }));

    } catch (err: any) {
      setError(`Failed to generate lesson plan: ${err.message}`);
      setView('form');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewPlan = () => {
    setView('form');
    setLessonPlan('');
    setError(null);
  };

  // Filter and search entries
  const filteredEntries = React.useMemo(() => {
    let filtered = rootWorkFramework.entries;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = searchEntries(filtered, searchQuery);
    }
    
    return sortEntriesByPriority(filtered);
  }, [rootWorkFramework.entries, selectedCategory, searchQuery]);

  // --- Render UI ---
  return (
    <div className="bg-slate-100 font-sans p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg">
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-t-xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold">Root Work Framework</h1>
            <p className="text-lg opacity-90 mt-2">Professional Development Platform for Healing-Centered Education</p>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setActiveTab('generator')}
              className={cn(
                "px-6 py-3 rounded-lg font-semibold transition-all duration-300",
                activeTab === 'generator' 
                  ? "bg-white text-indigo-600 shadow-lg" 
                  : "bg-indigo-500 text-white hover:bg-indigo-400"
              )}
            >
              📚 Lesson Generator
            </button>
            <button
              onClick={() => setActiveTab('framework')}
              className={cn(
                "px-6 py-3 rounded-lg font-semibold transition-all duration-300",
                activeTab === 'framework' 
                  ? "bg-white text-indigo-600 shadow-lg" 
                  : "bg-indigo-500 text-white hover:bg-indigo-400"
              )}
            >
              🗂️ Framework Manager
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "px-6 py-3 rounded-lg font-semibold transition-all duration-300",
                activeTab === 'dashboard' 
                  ? "bg-white text-indigo-600 shadow-lg" 
                  : "bg-indigo-500 text-white hover:bg-indigo-400"
              )}
            >
              📊 Professional Dashboard
            </button>
          </nav>
        </header>

        <main className="p-8">
          {/* LESSON GENERATOR TAB */}
          {activeTab === 'generator' && (
            <>
              {view === 'form' && user && (
                <form id="form-section" onSubmit={handleGeneratePlan}>
                  <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-lg mb-8">
                    <h3 className="text-lg font-bold text-green-900 mb-2">🌱 About the Rootwork Framework</h3>
                    <p>This tool generates comprehensive lesson plans grounded in trauma-informed practices, healing-centered pedagogy, and culturally responsive education.</p>
                     <div className="mt-2 font-semibold">Monthly Usage: {usageInfo.count} / {usageInfo.limit}</div>
                  </div>

                  {error && <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="form-group">
                      <label htmlFor="gradeLevel" className="block mb-2 font-semibold text-slate-700">Grade Level *</label>
                      <select id="gradeLevel" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500">
                        <option value="">Select Grade</option>
                        {[...Array(13).keys()].map(i => {
                          const grade = i === 0 ? 'K' : `${i}th`;
                          const label = i === 0 ? 'Kindergarten' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Grade`;
                          return <option key={grade} value={label}>{label}</option>
                        })}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="duration" className="block mb-2 font-semibold text-slate-700">Duration *</label>
                      <select id="duration" value={duration} onChange={e => setDuration(e.target.value)} required className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500">
                        {[...Array(5).keys()].map(i => (
                          <option key={i+1} value={i+1}>{i+1} Day{i > 0 ? 's' : ''} ({ (i+1) * 90 } min)</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="unitTitle" className="block mb-2 font-semibold text-slate-700">Unit Title</label>
                      <input type="text" id="unitTitle" value={unitTitle} onChange={e => setUnitTitle(e.target.value)} placeholder="e.g., Community Storytelling" className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"/>
                    </div>
                  </div>
                  <div className="form-group mb-4">
                    <label htmlFor="subject" className="block mb-2 font-semibold text-slate-700">Subject Area(s) *</label>
                    <select id="subject" multiple value={subjects} onChange={handleSubjectChange} required className="w-full p-3 h-40 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500">
                       {['English Language Arts', 'Mathematics', 'Science', 'Social Studies', 'Art', 'Music', 'Physical Education', 'Special Education', 'STEAM', 'Agriculture', 'Career and Technical Education'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="text-sm text-slate-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects.</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="form-group">
                      <label htmlFor="standards" className="block mb-2 font-semibold text-slate-700">Standards Alignment</label>
                      <textarea id="standards" value={standards} onChange={e => setStandards(e.target.value)} rows={3} placeholder="Enter relevant state standards or learning objectives..." className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"></textarea>
                    </div>
                    <div className="form-group">
                      <label htmlFor="focus" className="block mb-2 font-semibold text-slate-700">Additional Focus Areas</label>
                      <textarea id="focus" value={focus} onChange={e => setFocus(e.target.value)} rows={3} placeholder="Special accommodations, therapeutic goals, etc..." className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"></textarea>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white p-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-300">
                    Generate Comprehensive Lesson Plan
                  </button>
                </form>
              )}

              {(view === 'loading' || (view === 'form' && !user)) && (
                <div id="loading-section" className="text-center p-12">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Initializing Secure Session...</p>
                </div>
              )}

              {view === 'results' && (
                <div id="results-section">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">✨ Your Rootwork Framework Lesson Plan is Ready!</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                    <button onClick={() => { /* Download functionality can be added here */ }} className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition duration-300">
                      📥 Download (.md)
                    </button>
                    <button onClick={handleNewPlan} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300">
                      Create New Plan
                    </button>
                  </div>
                  <div className="prose prose-indigo lg:prose-lg max-w-none rounded-lg border border-slate-200 bg-slate-50 p-6 sm:p-8">
                     <ReactMarkdown>{lessonPlan}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          {/* FRAMEWORK MANAGER TAB */}
          {activeTab === 'framework' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Root Work Framework Manager</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowEntryForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
                  >
                    ➕ Add Entry
                  </button>
                  <button 
                    onClick={exportFramework}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition duration-300"
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="legal">Legal</option>
                  <option value="educational">Educational</option>
                  <option value="compliance">Compliance</option>
                  <option value="policy">Policy</option>
                  <option value="planning">Planning</option>
                </select>
              </div>

              {/* Add Entry Form */}
              {showEntryForm && (
                <div className="bg-slate-50 p-6 rounded-lg border-2 border-slate-200">
                  <h3 className="text-lg font-semibold mb-4">Add New Root Work Entry</h3>
                  {error && <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Entry Title *"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                    <select
                      value={newEntry.category}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value as any }))}
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="legal">Legal</option>
                      <option value="educational">Educational</option>
                      <option value="compliance">Compliance</option>
                      <option value="policy">Policy</option>
                      <option value="planning">Planning</option>
                    </select>
                  </div>
                  
                  <textarea
                    placeholder="Description *"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 mb-4"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <select
                      value={newEntry.priority}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="critical">Critical Priority</option>
                    </select>
                    
                    <select
                      value={newEntry.status}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, status: e.target.value as any }))}
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Assignee"
                      value={newEntry.assignee}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, assignee: e.target.value }))}
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={addRootWorkEntry}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
                    >
                      Add Entry
                    </button>
                    <button 
                      onClick={() => {
                        setShowEntryForm(false);
                        setError(null);
                      }}
                      className="bg-slate-400 text-white px-6 py-2 rounded-lg hover:bg-slate-500 transition duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Entries List */}
              <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-xl">No entries found</p>
                    <p>Start by adding your first Root Work Framework entry!</p>
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <div key={entry.id} className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">{entry.title}</h3>
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getCategoryColor(entry.category))}>
                              {entry.category}
                            </span>
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(entry.status))}>
                              {entry.status}
                            </span>
                          </div>
                          
                          <p className="text-slate-600 mb-2">{entry.description}</p>
                          
                          {entry.complianceFlags && entry.complianceFlags.length > 0 && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-red-600">⚠️ Compliance Flags:</span>
                              <ul className="text-sm text-red-600 ml-4">
                                {entry.complianceFlags.map((flag, index) => (
                                  <li key={index}>• {flag}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {entry.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="text-sm text-slate-500">
                            {entry.assignee && <span>Assigned to: {entry.assignee} • </span>}
                            Updated: {formatDate(entry.updatedAt)}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <select
                            value={entry.status}
                            onChange={(e) => updateEntryStatus(entry.id, e.target.value as any)}
                            className="p-2 border border-slate-300 rounded text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                          <button 
                            onClick={() => deleteEntry(entry.id)}
                            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition duration-300 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PROFESSIONAL DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Professional Development Dashboard</h2>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900">Total Entries</h3>
                  <p className="text-3xl font-bold text-blue-600">{rootWorkFramework.entries.length}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900">Completed</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {rootWorkFramework.entries.filter(e => e.status === 'completed').length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-900">In Progress</h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    {rootWorkFramework.entries.filter(e => e.status === 'in-progress').length}
                  </p>
                </div>
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <h3 className="text-lg font-semibold text-red-900">Compliance Issues</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {rootWorkFramework.entries.filter(e => e.complianceFlags && e.complianceFlags.length > 0).length}
                  </p>
                </div>
              </div>

              {/* Framework Metadata */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold mb-4">Framework Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Version:</span> {rootWorkFramework.metadata.version}
                  </div>
                  <div>
                    <span className="font-medium">Created by:</span> {rootWorkFramework.metadata.createdBy}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {formatDate(rootWorkFramework.metadata.lastUpdated)}
                  </div>
                </div>
              </div>

              {/* Integration Instructions */}
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">🎓 Thinkific Course Integration</h3>
                <p className="text-indigo-800 mb-4">
                  Your Root Work Framework is ready for integration into your professional development courses. 
                  Each framework entry can be transformed into course modules for summer/fall 2025 deployment.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-indigo-900">Export Options:</h4>
                    <ul className="list-disc list-inside text-indigo-700 mt-2">
                      <li>CSV for data analysis</li>
                      <li>Lesson plans for course content</li>
                      <li>Compliance reports for audit readiness</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-900">Professional Features:</h4>
                    <ul className="list-disc list-inside text-indigo-700 mt-2">
                      <li>IDEA, FERPA, HIPAA compliance tracking</li>
                      <li>Priority-based workflow management</li>
                      <li>Educational standards alignment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

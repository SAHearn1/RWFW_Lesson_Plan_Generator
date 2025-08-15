'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function HomePage() {
  // All of your state variables are preserved
  const [unitTitle, setUnitTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');
  const [days, setDays] = useState('3');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [showQuickStart, setShowQuickStart] = useState(false);

  const statusMessages = [
    "Analyzing your standards and objectives...",
    "Integrating trauma-informed pedagogical approaches...",
    "Crafting interdisciplinary connections...",
    "Developing engagement strategies...",
    "Creating assessment frameworks...",
    "Finalizing implementation guidance...",
    "Almost ready - polishing your lesson plan..."
  ];

  const simulateProgress = (duration: number) => {
    const interval = 15000;
    const steps = Math.floor(duration / interval);
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < steps) {
        const progressPercent = ((currentStep + 1) / steps) * 100;
        setProgress(Math.min(progressPercent, 95));
        if (currentStep < statusMessages.length) {
          setGenerationStatus(statusMessages[currentStep]);
        }
        currentStep++;
      } else {
        setGenerationStatus("Almost ready - polishing your lesson plan...");
        clearInterval(progressInterval);
      }
    }, interval);
    return progressInterval;
  };

  // This function ONLY prepares the custom notes for styling before display.
  // ReactMarkdown will handle all other formatting (headers, tables, bold, etc.).
  const preprocessMarkdownForDisplay = (markdown: string): string => {
    if (!markdown) return '';
    return markdown
      .replace(/\[Teacher Note: (.*?)\]/g, '<div class="teacher-note"><strong>Teacher Note:</strong> $1</div>')
      .replace(/\[Student Note: (.*?)\]/g, '<div class="student-note"><strong>Student Note:</strong> $1</div>');
  };

  const generateLessonPlan = async () => {
    // Your robust form validation is preserved
    if (!unitTitle.trim()) {
      setGenerationStatus("❌ Please enter a unit title. Try something like 'Building Communities' or 'Environmental Science Connections'");
      setTimeout(() => setGenerationStatus(''), 5000);
      return;
    }
    if (!gradeLevel) {
      setGenerationStatus("❌ Please select a grade level for your lesson plan.");
      setTimeout(() => setGenerationStatus(''), 5000);
      return;
    }
    if (subjects.length === 0) {
      setGenerationStatus("❌ Please select at least one subject. For interdisciplinary units, select multiple subjects!");
      setTimeout(() => setGenerationStatus(''), 5000);
      return;
    }
    if (!days) {
      setGenerationStatus("❌ Please select the number of days for your lesson plan.");
      setTimeout(() => setGenerationStatus(''), 5000);
      return;
    }

    setIsLoading(true);
    setLessonPlan('');
    setGenerationStatus("Analyzing your standards and objectives...");
    setProgress(0);
    
    const estimatedDuration = Math.max(parseInt(days) * 60000, 120000);
    const progressInterval = simulateProgress(estimatedDuration);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller

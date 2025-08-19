const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsGenerating(true);
  setError('');
  setUsedFallback(false);

  // Minimal required validation (keep UX snappy)
  const missing: string[] = [];
  if (!formData.subject?.trim()) missing.push('Subject Area');
  if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
  if (!formData.topic?.trim()) missing.push('Lesson Topic');
  if (!formData.duration?.trim()) missing.push('Duration');
  if (missing.length) {
    setError(`Please fill in: ${missing.join(', ')}`);
    setIsGenerating(false);
    return;
  }

  const payload = {
    subject: formData.subject.trim(),
    gradeLevel: formData.gradeLevel.trim(),
    topic: formData.topic.trim(),
    duration: formData.duration.trim(),
    learningObjectives: formData.learningObjectives?.trim() || '',
    specialNeeds: formData.specialNeeds?.trim() || '',
    availableResources: formData.availableResources?.trim() || '',
  };

  // Helpful client-side visibility
  console.log('Submitting payload:', payload);

  try {
    const res = await fetch('/api/generate-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Read the JSON body (even on 4xx/5xx so we can see server debug info)
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // If response isn't JSON, keep raw text for troubleshooting
      const text = await res.text();
      console.log('Non-JSON response body:', text);
      throw new Error(`Server returned non-JSON (${res.status})`);
    }

    // <<< This is the bit you asked about — stringify the data for clear logs >>>
    console.log('Response status:', res.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    // If the server returns debug fields on 400, surface them clearly:
    if (res.status === 400 && data?.debug) {
      console.log('Server debug.headers:', JSON.stringify(data.debug.headers, null, 2));
      console.log('Server debug.receivedKeys:', JSON.stringify(data.debug.receivedKeys, null, 2));
      console.log('Server debug.receivedSample:', JSON.stringify(data.debug.receivedSample, null, 2));
    }

    if (!res.ok) {
      throw new Error(data?.error || `Server error: ${res.status}`);
    }

    if (!data?.lessonPlan) {
      throw new Error('No lesson plan returned');
    }

    setLessonPlan(data.lessonPlan);
    setUsedFallback(Boolean(data?.fallback));
  } catch (err: any) {
    setError(`Failed to generate lesson plan: ${err?.message || 'Unknown error'}`);
    console.error('Form submission error:', err);
  } finally {
    setIsGenerating(false);
  }
};

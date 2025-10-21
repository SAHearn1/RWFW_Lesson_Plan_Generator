import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for combining Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Additional utilities that existing components expect
export const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

export const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

// Date formatting utilities
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s()-]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Root Work Framework specific utilities
export interface RootWorkEntry {
  id: string;
  title: string;
  description: string;
  category: 'legal' | 'educational' | 'compliance' | 'policy' | 'planning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  dueDate?: Date;
  assignee?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  complianceFlags?: string[];
}

export interface RootWorkFramework {
  entries: RootWorkEntry[];
  metadata: {
    lastUpdated: Date;
    version: string;
    createdBy: string;
  };
}

// Framework validation
export const validateRootWorkEntry = (
  entry: Partial<RootWorkEntry>,
): string[] => {
  const errors: string[] = [];

  if (!entry.title?.trim()) {
    errors.push('Title is required');
  }

  if (!entry.description?.trim()) {
    errors.push('Description is required');
  }

  if (!entry.category) {
    errors.push('Category is required');
  }

  if (!entry.priority) {
    errors.push('Priority is required');
  }

  if (!entry.status) {
    errors.push('Status is required');
  }

  if (entry.dueDate && new Date(entry.dueDate) < new Date()) {
    errors.push('Due date cannot be in the past');
  }

  return errors;
};

// Compliance checking utilities
export const checkComplianceFlags = (entry: RootWorkEntry): string[] => {
  const flags: string[] = [];

  // IDEA compliance check
  if (
    entry.category === 'educational' &&
    entry.tags.includes('special-education')
  ) {
    if (!entry.tags.includes('idea-compliant')) {
      flags.push('IDEA compliance review needed');
    }
  }

  // FERPA compliance check
  if (
    entry.tags.includes('student-data') ||
    entry.tags.includes('educational-records')
  ) {
    if (!entry.tags.includes('ferpa-compliant')) {
      flags.push('FERPA compliance review needed');
    }
  }

  // HIPAA compliance check
  if (
    entry.tags.includes('health-records') ||
    entry.tags.includes('medical-information')
  ) {
    if (!entry.tags.includes('hipaa-compliant')) {
      flags.push('HIPAA compliance review needed');
    }
  }

  return flags;
};

// Priority scoring for sorting
export const getPriorityScore = (
  priority: RootWorkEntry['priority'],
): number => {
  const scores = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return scores[priority] || 0;
};

// Status color coding
export const getStatusColor = (status: RootWorkEntry['status']): string => {
  const colors = {
    pending: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Category color coding
export const getCategoryColor = (
  category: RootWorkEntry['category'],
): string => {
  const colors = {
    legal: 'bg-purple-100 text-purple-800',
    educational: 'bg-yellow-100 text-yellow-800',
    compliance: 'bg-red-100 text-red-800',
    policy: 'bg-indigo-100 text-indigo-800',
    planning: 'bg-teal-100 text-teal-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

// Filter and sort utilities
export const filterEntriesByCategory = (
  entries: RootWorkEntry[],
  category: RootWorkEntry['category'],
): RootWorkEntry[] => {
  return entries.filter((entry) => entry.category === category);
};

export const filterEntriesByStatus = (
  entries: RootWorkEntry[],
  status: RootWorkEntry['status'],
): RootWorkEntry[] => {
  return entries.filter((entry) => entry.status === status);
};

export const sortEntriesByPriority = (
  entries: RootWorkEntry[],
): RootWorkEntry[] => {
  return [...entries].sort(
    (a, b) => getPriorityScore(b.priority) - getPriorityScore(a.priority),
  );
};

export const sortEntriesByDueDate = (
  entries: RootWorkEntry[],
): RootWorkEntry[] => {
  return [...entries].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
};

// Search utility
export const searchEntries = (
  entries: RootWorkEntry[],
  query: string,
): RootWorkEntry[] => {
  const lowerQuery = query.toLowerCase();
  return entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      entry.assignee?.toLowerCase().includes(lowerQuery),
  );
};

// Export utilities
export const exportToCSV = (entries: RootWorkEntry[]): string => {
  const headers = [
    'Title',
    'Description',
    'Category',
    'Priority',
    'Status',
    'Due Date',
    'Assignee',
    'Tags',
  ];
  const csvContent = [
    headers.join(','),
    ...entries.map((entry) =>
      [
        `"${entry.title}"`,
        `"${entry.description}"`,
        entry.category,
        entry.priority,
        entry.status,
        entry.dueDate ? formatDate(entry.dueDate) : '',
        entry.assignee || '',
        `"${entry.tags.join('; ')}"`,
      ].join(','),
    ),
  ].join('\n');

  return csvContent;
};

// Generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Local storage utilities (production-safe - no console statements)
export const saveToLocalStorage = (key: string, data: any): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Silent fail - errors are swallowed in production for clean builds
    }
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      // Silent fail - return default value
      return defaultValue;
    }
  }
  return defaultValue;
};

// Professional development utilities for course integration
export const generateLessonPlan = (entry: RootWorkEntry): string => {
  return `
## Root Work Framework: ${entry.title}

### Category: ${capitalize(entry.category)}
### Priority: ${capitalize(entry.priority)}

### Learning Objectives:
- Understand the framework application for ${entry.category} contexts
- Apply compliance requirements where applicable
- Develop actionable implementation strategies

### Description:
${entry.description}

### Compliance Considerations:
${entry.complianceFlags?.length ? entry.complianceFlags.join('\n- ') : 'Standard compliance protocols apply'}

### Next Steps:
${entry.status === 'completed' ? 'Review and document lessons learned' : 'Continue implementation as planned'}
  `.trim();
};

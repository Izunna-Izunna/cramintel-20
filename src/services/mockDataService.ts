// Mock Data Service for Demo Mode
// This provides realistic demo data for all dashboard components

import { FlashcardDeck, Flashcard } from '@/hooks/useFlashcardDecks';
import { Prediction } from '@/hooks/usePredictions';
import { Material, MaterialGroup } from '@/hooks/useMaterials';
import { StudyStats } from '@/hooks/useStudyAnalytics';

// Check if mock data should be used
export const shouldUseMockData = () => {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
};

// Mock User Profile Data
export const mockUserProfile = {
  id: 'mock-user-123',
  name: 'Sarah Chen',
  email: 'sarah.chen@mit.edu',
  school: 'Massachusetts Institute of Technology',
  department: 'Computer Science & Engineering',
  courses: ['Data Structures & Algorithms', 'Machine Learning', 'Computer Networks', 'Database Systems'],
  study_style: 'Visual & Interactive',
  lecturers: [
    { name: 'Prof. Johnson', course: 'Data Structures & Algorithms', style: 'Mathematical' },
    { name: 'Dr. Smith', course: 'Machine Learning', style: 'Practical' },
    { name: 'Prof. Wilson', course: 'Computer Networks', style: 'Conceptual' },
    { name: 'Dr. Brown', course: 'Database Systems', style: 'Applied' }
  ],
  avatar_url: null
};

// Mock Materials Data
export const mockMaterials: Material[] = [
  {
    id: 'mat-1',
    name: 'Binary Trees & BST Lecture Notes',
    material_type: 'Lecture Notes',
    course: 'Data Structures & Algorithms',
    file_type: 'PDF',
    file_name: 'binary-trees-lecture.pdf',
    file_size: 2450000,
    processed: true,
    upload_date: '2024-09-22T10:30:00Z',
    group_id: 'group-1',
    group_name: 'Week 5 Materials',
    processing_status: 'completed'
  },
  {
    id: 'mat-2',
    name: 'Neural Networks Introduction',
    material_type: 'Textbook Chapter',
    course: 'Machine Learning',
    file_type: 'PDF',
    file_name: 'neural-networks-ch3.pdf',
    file_size: 3200000,
    processed: true,
    upload_date: '2024-09-21T14:15:00Z',
    group_id: 'group-2',
    group_name: 'ML Fundamentals',
    processing_status: 'completed'
  },
  {
    id: 'mat-3',
    name: 'TCP/IP Protocol Stack',
    material_type: 'Research Paper',
    course: 'Computer Networks',
    file_type: 'PDF',
    file_name: 'tcp-ip-protocol.pdf',
    file_size: 1800000,
    processed: true,
    upload_date: '2024-09-20T09:45:00Z',
    group_id: 'group-3',
    group_name: 'Network Protocols',
    processing_status: 'completed'
  },
  {
    id: 'mat-4',
    name: 'Database Normalization Guide',
    material_type: 'Study Guide',
    course: 'Database Systems',
    file_type: 'PDF',
    file_name: 'db-normalization.pdf',
    file_size: 1200000,
    processed: true,
    upload_date: '2024-09-19T16:20:00Z',
    group_id: 'group-4',
    group_name: 'Database Design',
    processing_status: 'completed'
  },
  {
    id: 'mat-5',
    name: 'Algorithm Complexity Analysis',
    material_type: 'Lecture Slides',
    course: 'Data Structures & Algorithms',
    file_type: 'PDF',
    file_name: 'complexity-analysis.pdf',
    file_size: 2100000,
    processed: true,
    upload_date: '2024-09-18T11:30:00Z',
    group_id: 'group-1',
    group_name: 'Week 5 Materials',
    processing_status: 'completed'
  },
  {
    id: 'mat-6',
    name: 'Deep Learning Fundamentals',
    material_type: 'Video Transcript',
    course: 'Machine Learning',
    file_type: 'PDF',
    file_name: 'deep-learning-transcript.pdf',
    file_size: 950000,
    processed: true,
    upload_date: '2024-09-17T13:45:00Z',
    group_id: 'group-2',
    group_name: 'ML Fundamentals',
    processing_status: 'completed'
  },
  {
    id: 'mat-7',
    name: 'SQL Advanced Queries',
    material_type: 'Practice Problems',
    course: 'Database Systems',
    file_type: 'PDF',
    file_name: 'sql-advanced.pdf',
    file_size: 1650000,
    processed: false,
    upload_date: '2024-09-23T08:15:00Z',
    group_id: 'group-5',
    group_name: 'Recent Upload',
    processing_status: 'processing',
    processing_progress: 75
  }
];

// Mock Material Groups
export const mockMaterialGroups: MaterialGroup[] = [
  {
    group_id: 'group-1',
    group_name: 'Week 5 Materials',
    materials: mockMaterials.filter(m => m.group_id === 'group-1'),
    total_count: 2,
    processed_count: 2,
    upload_date: '2024-09-22T10:30:00Z'
  },
  {
    group_id: 'group-2',
    group_name: 'ML Fundamentals',
    materials: mockMaterials.filter(m => m.group_id === 'group-2'),
    total_count: 2,
    processed_count: 2,
    upload_date: '2024-09-21T14:15:00Z'
  },
  {
    group_id: 'group-3',
    group_name: 'Network Protocols',
    materials: mockMaterials.filter(m => m.group_id === 'group-3'),
    total_count: 1,
    processed_count: 1,
    upload_date: '2024-09-20T09:45:00Z'
  },
  {
    group_id: 'group-4',
    group_name: 'Database Design',
    materials: mockMaterials.filter(m => m.group_id === 'group-4'),
    total_count: 1,
    processed_count: 1,
    upload_date: '2024-09-19T16:20:00Z'
  },
  {
    group_id: 'group-5',
    group_name: 'Recent Upload',
    materials: mockMaterials.filter(m => m.group_id === 'group-5'),
    total_count: 1,
    processed_count: 0,
    upload_date: '2024-09-23T08:15:00Z'
  }
];

// Mock Flashcard Decks
export const mockFlashcardDecks: FlashcardDeck[] = [
  {
    id: 'deck-1',
    name: 'Binary Search Trees',
    description: 'Comprehensive BST operations and properties',
    course: 'Data Structures & Algorithms',
    format: 'Q&A',
    tags: ['trees', 'algorithms', 'search'],
    source_materials: ['mat-1', 'mat-5'],
    total_cards: 24,
    cards_mastered: 18,
    study_streak: 7,
    last_studied: '2024-09-22T20:30:00Z',
    created_at: '2024-09-15T10:00:00Z',
    updated_at: '2024-09-22T20:30:00Z'
  },
  {
    id: 'deck-2',
    name: 'Neural Network Basics',
    description: 'Fundamentals of neural networks and backpropagation',
    course: 'Machine Learning',
    format: 'Q&A',
    tags: ['neural-networks', 'ML', 'deep-learning'],
    source_materials: ['mat-2', 'mat-6'],
    total_cards: 32,
    cards_mastered: 22,
    study_streak: 5,
    last_studied: '2024-09-21T19:15:00Z',
    created_at: '2024-09-12T14:30:00Z',
    updated_at: '2024-09-21T19:15:00Z'
  },
  {
    id: 'deck-3',
    name: 'Network Protocols',
    description: 'TCP/IP stack and network communication',
    course: 'Computer Networks',
    format: 'Q&A',
    tags: ['networking', 'protocols', 'TCP-IP'],
    source_materials: ['mat-3'],
    total_cards: 18,
    cards_mastered: 12,
    study_streak: 3,
    last_studied: '2024-09-20T18:45:00Z',
    created_at: '2024-09-10T16:20:00Z',
    updated_at: '2024-09-20T18:45:00Z'
  },
  {
    id: 'deck-4',
    name: 'Database Normalization',
    description: 'Normal forms and database design principles',
    course: 'Database Systems',
    format: 'Q&A',
    tags: ['database', 'normalization', 'design'],
    source_materials: ['mat-4'],
    total_cards: 15,
    cards_mastered: 9,
    study_streak: 2,
    last_studied: '2024-09-19T17:30:00Z',
    created_at: '2024-09-08T11:45:00Z',
    updated_at: '2024-09-19T17:30:00Z'
  }
];

// Mock Flashcards
export const mockFlashcards: Flashcard[] = [
  {
    id: 'card-1',
    question: 'What is the time complexity of searching in a balanced BST?',
    answer: 'O(log n) - In a balanced binary search tree, the height is logarithmic, so search operations take O(log n) time.',
    course: 'Data Structures & Algorithms',
    difficulty_level: 'Medium',
    mastery_level: 4,
    times_reviewed: 8,
    last_reviewed: '2024-09-22T20:30:00Z',
    next_review: '2024-09-26T20:30:00Z',
    created_at: '2024-09-15T10:00:00Z'
  },
  {
    id: 'card-2',
    question: 'What is the activation function commonly used in hidden layers of neural networks?',
    answer: 'ReLU (Rectified Linear Unit) - ReLU is the most commonly used activation function in hidden layers because it helps solve the vanishing gradient problem and is computationally efficient.',
    course: 'Machine Learning',
    difficulty_level: 'Easy',
    mastery_level: 5,
    times_reviewed: 12,
    last_reviewed: '2024-09-21T19:15:00Z',
    next_review: '2024-09-28T19:15:00Z',
    created_at: '2024-09-12T14:30:00Z'
  }
];

// Mock Predictions
export const mockPredictions: Prediction[] = [
  {
    id: 'pred-1',
    course: 'Data Structures & Algorithms',
    questions: [
      {
        id: 1,
        question: 'Implement a function to find the lowest common ancestor of two nodes in a binary search tree.',
        type: 'coding',
        difficulty: 'medium',
        confidence: 0.92,
        topics: ['BST', 'Tree Traversal', 'Algorithms']
      },
      {
        id: 2,
        question: 'Explain the time complexity of different sorting algorithms and when to use each.',
        type: 'theory',
        difficulty: 'medium', 
        confidence: 0.88,
        topics: ['Sorting', 'Time Complexity', 'Algorithm Analysis']
      }
    ],
    confidence_score: 0.90,
    generated_at: '2024-09-22T15:30:00Z',
    status: 'completed',
    prediction_type: 'midterm',
    exam_date: '2024-09-28T09:00:00Z'
  },
  {
    id: 'pred-2',
    course: 'Machine Learning',
    questions: [
      {
        id: 1,
        question: 'Derive the backpropagation algorithm for a multi-layer neural network.',
        type: 'mathematical',
        difficulty: 'hard',
        confidence: 0.85,
        topics: ['Neural Networks', 'Backpropagation', 'Calculus']
      },
      {
        id: 2,
        question: 'Compare and contrast supervised, unsupervised, and reinforcement learning with examples.',
        type: 'theory',
        difficulty: 'medium',
        confidence: 0.91,
        topics: ['ML Types', 'Learning Paradigms', 'Applications']
      }
    ],
    confidence_score: 0.88,
    generated_at: '2024-09-21T11:45:00Z',
    status: 'completed',
    prediction_type: 'final',
    exam_date: '2024-10-15T14:00:00Z'
  }
];

// Mock Study Analytics
export const mockStudyStats: StudyStats = {
  flashcards_studied_today: 28,
  cards_mastered_today: 6,
  current_streak: 12,
  best_streak: 18,
  total_study_time_today: 85, // minutes
  accuracy_rate_today: 89.5
};

// Mock Dashboard Stats
export const mockDashboardStats = {
  weeklyUploads: 4,
  weeklyTarget: 5,
  totalFlashcards: 89,
  studyStreak: 12,
  coursesProgress: [
    {
      name: 'Data Structures & Algorithms',
      progress: 85,
      uploads: 2,
      target: 3
    },
    {
      name: 'Machine Learning',
      progress: 75,
      uploads: 2,
      target: 3
    },
    {
      name: 'Computer Networks',
      progress: 60,
      uploads: 1,
      target: 3
    },
    {
      name: 'Database Systems',
      progress: 90,
      uploads: 2,
      target: 3
    }
  ],
  recentActivity: [
    {
      type: 'upload' as const,
      title: 'Uploaded Binary Trees & BST Lecture Notes',
      time: '2024-09-22',
      course: 'Data Structures & Algorithms'
    },
    {
      type: 'study' as const,
      title: 'Completed Neural Network Basics deck',
      time: '2024-09-21'
    },
    {
      type: 'upload' as const,
      title: 'Uploaded Neural Networks Introduction',
      time: '2024-09-21',
      course: 'Machine Learning'
    },
    {
      type: 'flashcard' as const,
      title: 'Created new flashcard deck',
      time: '2024-09-20',
      course: 'Computer Networks'
    },
    {
      type: 'study' as const,
      title: 'Study session completed',
      time: '2024-09-20'
    }
  ]
};

// Utility function to add realistic delays for demo purposes
export const mockDelay = (ms: number = 800) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
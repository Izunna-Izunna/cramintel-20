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

// Mock User Profile Data - Enhanced Version
export const mockUserProfile = {
  id: 'mock-user-123',
  name: 'Sarah Chen',
  email: 'sarah.chen@mit.edu',
  school: 'Massachusetts Institute of Technology',
  department: 'Computer Science & Engineering',
  courses: [
    'Data Structures & Algorithms', 
    'Machine Learning', 
    'Advanced Calculus', 
    'Quantum Physics', 
    'Molecular Biology', 
    'Organic Chemistry'
  ],
  study_style: 'Visual & Interactive Learning',
  lecturers: [
    { name: 'Prof. Johnson', course: 'Data Structures & Algorithms', style: 'Mathematical & Rigorous' },
    { name: 'Dr. Smith', course: 'Machine Learning', style: 'Practical & Applied' },
    { name: 'Prof. Williams', course: 'Advanced Calculus', style: 'Theoretical & Proof-based' },
    { name: 'Dr. Anderson', course: 'Quantum Physics', style: 'Conceptual & Visual' },
    { name: 'Prof. Martinez', course: 'Molecular Biology', style: 'Experimental & Lab-focused' },
    { name: 'Dr. Thompson', course: 'Organic Chemistry', style: 'Mechanism-focused & Practical' }
  ],
  avatar_url: null,
  year: 'Senior (4th Year)',
  gpa: 3.89,
  total_study_hours: 247,
  favorite_study_time: 'Evening (7-10 PM)',
  study_goals: [
    'Maintain 3.9+ GPA',
    'Master advanced algorithms',
    'Complete thesis project',
    'Prepare for grad school applications'
  ]
};

// Mock Materials Data - Comprehensive Collection
export const mockMaterials: Material[] = [
  // Computer Science - Data Structures & Algorithms
  {
    id: 'mat-1',
    name: 'Binary Trees & BST Complete Guide',
    material_type: 'Lecture Notes',
    course: 'Data Structures & Algorithms',
    file_type: 'PDF',
    file_name: 'binary-trees-comprehensive.pdf',
    file_size: 3450000,
    processed: true,
    upload_date: '2024-09-22T10:30:00Z',
    group_id: 'group-cs-1',
    group_name: 'Advanced Tree Structures',
    processing_status: 'completed'
  },
  {
    id: 'mat-2',
    name: 'Algorithm Complexity & Big O Analysis',
    material_type: 'Lecture Slides',
    course: 'Data Structures & Algorithms',
    file_type: 'PDF',
    file_name: 'complexity-analysis-detailed.pdf',
    file_size: 2890000,
    processed: true,
    upload_date: '2024-09-21T14:15:00Z',
    group_id: 'group-cs-1',
    group_name: 'Advanced Tree Structures',
    processing_status: 'completed'
  },
  {
    id: 'mat-3',
    name: 'Graph Algorithms & Traversal Methods',
    material_type: 'Textbook Chapter',
    course: 'Data Structures & Algorithms',
    file_type: 'PDF',
    file_name: 'graph-algorithms-ch7.pdf',
    file_size: 4200000,
    processed: true,
    upload_date: '2024-09-20T16:45:00Z',
    group_id: 'group-cs-2',
    group_name: 'Graph Theory Applications',
    processing_status: 'completed'
  },
  {
    id: 'mat-4',
    name: 'Dynamic Programming Masterclass',
    material_type: 'Research Paper',
    course: 'Data Structures & Algorithms',
    file_type: 'PDF',
    file_name: 'dynamic-programming-advanced.pdf',
    file_size: 3650000,
    processed: true,
    upload_date: '2024-09-19T11:20:00Z',
    group_id: 'group-cs-2',
    group_name: 'Graph Theory Applications',
    processing_status: 'completed'
  },
  
  // Machine Learning
  {
    id: 'mat-5',
    name: 'Deep Learning Neural Networks',
    material_type: 'Textbook Chapter',
    course: 'Machine Learning',
    file_type: 'PDF',
    file_name: 'deep-learning-foundations.pdf',
    file_size: 5200000,
    processed: true,
    upload_date: '2024-09-18T09:30:00Z',
    group_id: 'group-ml-1',
    group_name: 'Neural Network Fundamentals',
    processing_status: 'completed'
  },
  {
    id: 'mat-6',
    name: 'Backpropagation & Gradient Descent',
    material_type: 'Lecture Notes',
    course: 'Machine Learning',
    file_type: 'PDF',
    file_name: 'backprop-gradient-descent.pdf',
    file_size: 2750000,
    processed: true,
    upload_date: '2024-09-17T13:45:00Z',
    group_id: 'group-ml-1',
    group_name: 'Neural Network Fundamentals',
    processing_status: 'completed'
  },
  {
    id: 'mat-7',
    name: 'Convolutional Neural Networks',
    material_type: 'Research Paper',
    course: 'Machine Learning',
    file_type: 'PDF',
    file_name: 'cnn-architecture-guide.pdf',
    file_size: 4100000,
    processed: true,
    upload_date: '2024-09-16T15:20:00Z',
    group_id: 'group-ml-2',
    group_name: 'Advanced ML Architectures',
    processing_status: 'completed'
  },

  // Mathematics - Calculus
  {
    id: 'mat-8',
    name: 'Multivariable Calculus Applications',
    material_type: 'Textbook Chapter',
    course: 'Advanced Calculus',
    file_type: 'PDF',
    file_name: 'multivariable-calculus-ch12.pdf',
    file_size: 3890000,
    processed: true,
    upload_date: '2024-09-15T10:15:00Z',
    group_id: 'group-math-1',
    group_name: 'Calculus Applications',
    processing_status: 'completed'
  },
  {
    id: 'mat-9',
    name: 'Vector Fields & Line Integrals',
    material_type: 'Problem Set',
    course: 'Advanced Calculus',
    file_type: 'PDF',
    file_name: 'vector-fields-problems.pdf',
    file_size: 2340000,
    processed: true,
    upload_date: '2024-09-14T14:30:00Z',
    group_id: 'group-math-1',
    group_name: 'Calculus Applications',
    processing_status: 'completed'
  },

  // Physics - Quantum Mechanics
  {
    id: 'mat-10',
    name: 'Quantum Mechanics Principles',
    material_type: 'Lecture Notes',
    course: 'Quantum Physics',
    file_type: 'PDF',
    file_name: 'quantum-mechanics-intro.pdf',
    file_size: 4560000,
    processed: true,
    upload_date: '2024-09-13T11:45:00Z',
    group_id: 'group-physics-1',
    group_name: 'Quantum Fundamentals',
    processing_status: 'completed'
  },
  {
    id: 'mat-11',
    name: 'Schrödinger Equation Solutions',
    material_type: 'Research Paper',
    course: 'Quantum Physics',
    file_type: 'PDF',
    file_name: 'schrodinger-solutions.pdf',
    file_size: 3210000,
    processed: true,
    upload_date: '2024-09-12T16:20:00Z',
    group_id: 'group-physics-1',
    group_name: 'Quantum Fundamentals',
    processing_status: 'completed'
  },

  // Biology - Molecular Biology
  {
    id: 'mat-12',
    name: 'DNA Replication Mechanisms',
    material_type: 'Textbook Chapter',
    course: 'Molecular Biology',
    file_type: 'PDF',
    file_name: 'dna-replication-ch8.pdf',
    file_size: 3780000,
    processed: true,
    upload_date: '2024-09-11T09:15:00Z',
    group_id: 'group-bio-1',
    group_name: 'Genetic Processes',
    processing_status: 'completed'
  },
  {
    id: 'mat-13',
    name: 'Protein Synthesis & Translation',
    material_type: 'Laboratory Manual',
    course: 'Molecular Biology',
    file_type: 'PDF',
    file_name: 'protein-synthesis-lab.pdf',
    file_size: 2950000,
    processed: true,
    upload_date: '2024-09-10T13:30:00Z',
    group_id: 'group-bio-1',
    group_name: 'Genetic Processes',
    processing_status: 'completed'
  },

  // Chemistry - Organic Chemistry
  {
    id: 'mat-14',
    name: 'Organic Reaction Mechanisms',
    material_type: 'Lecture Notes',
    course: 'Organic Chemistry',
    file_type: 'PDF',
    file_name: 'organic-mechanisms.pdf',
    file_size: 4120000,
    processed: true,
    upload_date: '2024-09-09T15:45:00Z',
    group_id: 'group-chem-1',
    group_name: 'Reaction Chemistry',
    processing_status: 'completed'
  },
  {
    id: 'mat-15',
    name: 'Stereochemistry & Chirality',
    material_type: 'Problem Set',
    course: 'Organic Chemistry',
    file_type: 'PDF',
    file_name: 'stereochemistry-problems.pdf',
    file_size: 2680000,
    processed: true,
    upload_date: '2024-09-08T12:10:00Z',
    group_id: 'group-chem-1',
    group_name: 'Reaction Chemistry',
    processing_status: 'completed'
  },

  // Recent uploads with varied processing states
  {
    id: 'mat-16',
    name: 'Advanced Machine Learning Algorithms',
    material_type: 'Research Paper',
    course: 'Machine Learning',
    file_type: 'PDF',
    file_name: 'advanced-ml-algorithms.pdf',
    file_size: 5890000,
    processed: false,
    upload_date: '2024-09-23T14:30:00Z',
    group_id: 'group-recent-1',
    group_name: 'Today\'s Upload',
    processing_status: 'processing',
    processing_progress: 85
  },
  {
    id: 'mat-17',
    name: 'Quantum Computing Fundamentals',
    material_type: 'Lecture Slides',
    course: 'Quantum Physics',
    file_type: 'PDF',
    file_name: 'quantum-computing-intro.pdf',
    file_size: 3450000,
    processed: false,
    upload_date: '2024-09-23T13:15:00Z',
    group_id: 'group-recent-1',
    group_name: 'Today\'s Upload',
    processing_status: 'processing',
    processing_progress: 62
  },
  {
    id: 'mat-18',
    name: 'Past Exam Questions - Data Structures',
    material_type: 'Past Questions',
    course: 'Data Structures & Algorithms',
    file_type: 'Image',
    file_name: 'past-exam-2023.jpg',
    file_size: 1890000,
    processed: true,
    upload_date: '2024-09-23T11:45:00Z',
    group_id: 'group-recent-2',
    group_name: 'Exam Preparation',
    processing_status: 'completed'
  },
  {
    id: 'mat-19',
    name: 'Biology Lab Report Template',
    material_type: 'Template',
    course: 'Molecular Biology',
    file_type: 'PDF',
    file_name: 'lab-report-template.pdf',
    file_size: 1250000,
    processed: true,
    upload_date: '2024-09-23T10:20:00Z',
    group_id: 'group-recent-2',
    group_name: 'Exam Preparation',
    processing_status: 'completed'
  },
  {
    id: 'mat-20',
    name: 'Chemistry Formula Reference',
    material_type: 'Reference Sheet',
    course: 'Organic Chemistry',
    file_type: 'PDF',
    file_name: 'chemistry-formulas.pdf',
    file_size: 890000,
    processed: false,
    upload_date: '2024-09-23T09:30:00Z',
    group_id: 'group-recent-2',
    group_name: 'Exam Preparation',
    processing_status: 'pending_ocr'
  }
];

// Mock Material Groups - Enhanced Collection
export const mockMaterialGroups: MaterialGroup[] = [
  {
    group_id: 'group-cs-1',
    group_name: 'Advanced Tree Structures',
    materials: mockMaterials.filter(m => m.group_id === 'group-cs-1'),
    total_count: 2,
    processed_count: 2,
    upload_date: '2024-09-22T10:30:00Z'
  },
  {
    group_id: 'group-cs-2',
    group_name: 'Graph Theory Applications',
    materials: mockMaterials.filter(m => m.group_id === 'group-cs-2'),
    total_count: 2,
    processed_count: 2,
    upload_date: '2024-09-20T16:45:00Z'
  },
  {
    group_id: 'group-ml-1',
    group_name: 'Neural Network Fundamentals',
    materials: mockMaterials.filter(m => m.group_id === 'group-ml-1'),
    total_count: 2,
    processed_count: 2,
    upload_date: '2024-09-18T09:30:00Z'
  },
  {
    group_id: 'group-ml-2',
    group_name: 'Advanced ML Architectures',
    materials: mockMaterials.filter(m => m.group_id === 'group-ml-2'),
    total_count: 1,
    processed_count: 1,
    upload_date: '2024-09-16T15:20:00Z'
  },
  {
    group_id: 'group-math-1',
    group_name: 'Calculus Applications',
    materials: mockMaterials.filter(m => m.group_id === 'group-math-1'),
    total_count: 2,
    processed_count: 2,
    upload_date: '2024-09-15T10:15:00Z'
  },
  {
    group_id: 'group-physics-1',
    group_name: 'Quantum Fundamentals',
    materials: mockMaterials.filter(m => m.group_id === 'group-physics-1'),
    total_count: 2,
    processed_count: 2,
    upload_date: '2024-09-13T11:45:00Z'
  },
  {
    group_id: 'group-bio-1',
    group_name: 'Genetic Processes',
    materials: mockMaterials.filter(m => m.group_id === 'group-bio-1'),
    total_count: 2,
    processed_count: 2,
    upload_date: '2024-09-11T09:15:00Z'
  },
  {
    group_id: 'group-chem-1',
    group_name: 'Reaction Chemistry',
    materials: mockMaterials.filter(m => m.group_id === 'group-chem-1'),
    total_count: 2,
    processed_count: 2,
    upload_date: '2024-09-09T15:45:00Z'
  },
  {
    group_id: 'group-recent-1',
    group_name: 'Today\'s Upload',
    materials: mockMaterials.filter(m => m.group_id === 'group-recent-1'),
    total_count: 2,
    processed_count: 0,
    upload_date: '2024-09-23T14:30:00Z'
  },
  {
    group_id: 'group-recent-2',
    group_name: 'Exam Preparation',
    materials: mockMaterials.filter(m => m.group_id === 'group-recent-2'),
    total_count: 3,
    processed_count: 2,
    upload_date: '2024-09-23T11:45:00Z'
  }
];

// Mock Flashcard Decks - Comprehensive Collection
export const mockFlashcardDecks: FlashcardDeck[] = [
  {
    id: 'deck-1',
    name: 'Advanced Tree Structures & BST',
    description: 'Complete guide to binary search trees, AVL trees, and tree operations with complexity analysis',
    course: 'Data Structures & Algorithms',
    format: 'Q&A',
    tags: ['trees', 'algorithms', 'search', 'complexity'],
    source_materials: ['mat-1', 'mat-2'],
    total_cards: 32,
    cards_mastered: 26,
    study_streak: 14,
    last_studied: '2024-09-23T08:30:00Z',
    created_at: '2024-09-15T10:00:00Z',
    updated_at: '2024-09-23T08:30:00Z'
  },
  {
    id: 'deck-2',
    name: 'Graph Algorithms Mastery',
    description: 'DFS, BFS, shortest path algorithms, and graph traversal techniques',
    course: 'Data Structures & Algorithms',
    format: 'Q&A',
    tags: ['graphs', 'traversal', 'algorithms', 'paths'],
    source_materials: ['mat-3', 'mat-4'],
    total_cards: 28,
    cards_mastered: 22,
    study_streak: 11,
    last_studied: '2024-09-22T19:45:00Z',
    created_at: '2024-09-12T14:30:00Z',
    updated_at: '2024-09-22T19:45:00Z'
  },
  {
    id: 'deck-3',
    name: 'Deep Learning Fundamentals',
    description: 'Neural networks, backpropagation, activation functions, and network architectures',
    course: 'Machine Learning',
    format: 'Q&A',
    tags: ['neural-networks', 'deep-learning', 'backprop', 'AI'],
    source_materials: ['mat-5', 'mat-6', 'mat-7'],
    total_cards: 45,
    cards_mastered: 31,
    study_streak: 8,
    last_studied: '2024-09-22T16:20:00Z',
    created_at: '2024-09-10T16:20:00Z',
    updated_at: '2024-09-22T16:20:00Z'
  },
  {
    id: 'deck-4',
    name: 'Multivariable Calculus Applications',
    description: 'Vector fields, line integrals, surface integrals, and multivariable optimization',
    course: 'Advanced Calculus',
    format: 'Q&A',
    tags: ['calculus', 'vectors', 'integrals', 'optimization'],
    source_materials: ['mat-8', 'mat-9'],
    total_cards: 24,
    cards_mastered: 18,
    study_streak: 6,
    last_studied: '2024-09-21T21:15:00Z',
    created_at: '2024-09-08T11:45:00Z',
    updated_at: '2024-09-21T21:15:00Z'
  },
  {
    id: 'deck-5',
    name: 'Quantum Mechanics Principles',
    description: 'Wave functions, Schrödinger equation, quantum states, and measurement theory',
    course: 'Quantum Physics',
    format: 'Q&A',
    tags: ['quantum', 'physics', 'schrodinger', 'wavefunctions'],
    source_materials: ['mat-10', 'mat-11'],
    total_cards: 35,
    cards_mastered: 24,
    study_streak: 9,
    last_studied: '2024-09-21T14:30:00Z',
    created_at: '2024-09-07T09:20:00Z',
    updated_at: '2024-09-21T14:30:00Z'
  },
  {
    id: 'deck-6',
    name: 'Molecular Biology Mechanisms',
    description: 'DNA replication, transcription, translation, and protein synthesis pathways',
    course: 'Molecular Biology',
    format: 'Q&A',
    tags: ['DNA', 'proteins', 'replication', 'transcription'],
    source_materials: ['mat-12', 'mat-13'],
    total_cards: 29,
    cards_mastered: 19,
    study_streak: 5,
    last_studied: '2024-09-20T18:45:00Z',
    created_at: '2024-09-06T15:30:00Z',
    updated_at: '2024-09-20T18:45:00Z'
  },
  {
    id: 'deck-7',
    name: 'Organic Chemistry Reactions',
    description: 'Reaction mechanisms, stereochemistry, and organic synthesis strategies',
    course: 'Organic Chemistry',
    format: 'Q&A',
    tags: ['organic', 'reactions', 'mechanisms', 'stereochemistry'],
    source_materials: ['mat-14', 'mat-15'],
    total_cards: 38,
    cards_mastered: 25,
    study_streak: 7,
    last_studied: '2024-09-20T12:20:00Z',
    created_at: '2024-09-05T13:15:00Z',
    updated_at: '2024-09-20T12:20:00Z'
  },
  {
    id: 'deck-8',
    name: 'Advanced ML Algorithms',
    description: 'Support vector machines, random forests, ensemble methods, and optimization',
    course: 'Machine Learning',
    format: 'Q&A',
    tags: ['ML', 'algorithms', 'SVM', 'ensemble'],
    source_materials: ['mat-16'],
    total_cards: 22,
    cards_mastered: 8,
    study_streak: 3,
    last_studied: '2024-09-19T17:30:00Z',
    created_at: '2024-09-18T10:45:00Z',
    updated_at: '2024-09-19T17:30:00Z'
  },
  {
    id: 'deck-9',
    name: 'Dynamic Programming Strategies',
    description: 'Memoization, tabulation, optimal substructure, and classic DP problems',
    course: 'Data Structures & Algorithms',
    format: 'Q&A',
    tags: ['DP', 'optimization', 'memoization', 'algorithms'],
    source_materials: ['mat-4'],
    total_cards: 26,
    cards_mastered: 15,
    study_streak: 4,
    last_studied: '2024-09-19T13:45:00Z',
    created_at: '2024-09-04T16:20:00Z',
    updated_at: '2024-09-19T13:45:00Z'
  },
  {
    id: 'deck-10',
    name: 'Quantum Computing Basics',
    description: 'Qubits, quantum gates, superposition, entanglement, and quantum algorithms',
    course: 'Quantum Physics',
    format: 'Q&A',
    tags: ['quantum-computing', 'qubits', 'gates', 'algorithms'],
    source_materials: ['mat-17'],
    total_cards: 18,
    cards_mastered: 6,
    study_streak: 2,
    last_studied: '2024-09-18T20:15:00Z',
    created_at: '2024-09-17T11:30:00Z',
    updated_at: '2024-09-18T20:15:00Z'
  }
];

// Mock Flashcards - Comprehensive Collection (50+ cards)
export const mockFlashcards: Flashcard[] = [
  // Data Structures & Algorithms Cards
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
    question: 'Explain the difference between DFS and BFS traversal algorithms.',
    answer: 'DFS (Depth-First Search) explores as far as possible along each branch before backtracking, using a stack (or recursion). BFS (Breadth-First Search) explores all neighbors at the current depth before moving to nodes at the next depth level, using a queue.',
    course: 'Data Structures & Algorithms',
    difficulty_level: 'Medium',
    mastery_level: 5,
    times_reviewed: 12,
    last_reviewed: '2024-09-22T19:45:00Z',
    next_review: '2024-09-27T19:45:00Z',
    created_at: '2024-09-12T14:30:00Z'
  },
  {
    id: 'card-3',
    question: 'What is dynamic programming and when should it be used?',
    answer: 'Dynamic programming is an algorithmic technique that solves complex problems by breaking them down into simpler subproblems. It should be used when the problem has: 1) Optimal substructure, 2) Overlapping subproblems. Classic examples include Fibonacci sequence, knapsack problem, and longest common subsequence.',
    course: 'Data Structures & Algorithms',
    difficulty_level: 'Hard',
    mastery_level: 3,
    times_reviewed: 6,
    last_reviewed: '2024-09-21T16:20:00Z',
    next_review: '2024-09-25T16:20:00Z',
    created_at: '2024-09-10T11:15:00Z'
  },
  {
    id: 'card-4',
    question: 'What is the space complexity of merge sort?',
    answer: 'O(n) - Merge sort requires additional space for the temporary arrays used during the merge process. The space complexity is linear because we need to store all n elements during the merging phase.',
    course: 'Data Structures & Algorithms',
    difficulty_level: 'Medium',
    mastery_level: 4,
    times_reviewed: 9,
    last_reviewed: '2024-09-20T14:10:00Z',
    next_review: '2024-09-24T14:10:00Z',
    created_at: '2024-09-08T09:30:00Z'
  },

  // Machine Learning Cards
  {
    id: 'card-5',
    question: 'What is the activation function commonly used in hidden layers of neural networks?',
    answer: 'ReLU (Rectified Linear Unit) - ReLU is the most commonly used activation function in hidden layers because it helps solve the vanishing gradient problem and is computationally efficient. f(x) = max(0, x)',
    course: 'Machine Learning',
    difficulty_level: 'Easy',
    mastery_level: 5,
    times_reviewed: 12,
    last_reviewed: '2024-09-22T16:20:00Z',
    next_review: '2024-09-28T16:20:00Z',
    created_at: '2024-09-12T14:30:00Z'
  },
  {
    id: 'card-6',
    question: 'Explain the backpropagation algorithm in neural networks.',
    answer: 'Backpropagation is the algorithm used to train neural networks by computing gradients of the loss function with respect to the network weights. It works by: 1) Forward pass - compute output, 2) Calculate loss, 3) Backward pass - compute gradients using chain rule, 4) Update weights using gradient descent.',
    course: 'Machine Learning',
    difficulty_level: 'Hard',
    mastery_level: 3,
    times_reviewed: 7,
    last_reviewed: '2024-09-21T18:30:00Z',
    next_review: '2024-09-25T18:30:00Z',
    created_at: '2024-09-10T16:45:00Z'
  },
  {
    id: 'card-7',
    question: 'What is overfitting and how can it be prevented?',
    answer: 'Overfitting occurs when a model learns the training data too well, including noise and irrelevant patterns, leading to poor generalization. Prevention methods: 1) Cross-validation, 2) Regularization (L1/L2), 3) Early stopping, 4) Dropout, 5) Data augmentation, 6) Ensemble methods.',
    course: 'Machine Learning',
    difficulty_level: 'Medium',
    mastery_level: 4,
    times_reviewed: 10,
    last_reviewed: '2024-09-20T12:15:00Z',
    next_review: '2024-09-24T12:15:00Z',
    created_at: '2024-09-09T14:20:00Z'
  },
  {
    id: 'card-8',
    question: 'What is the difference between supervised and unsupervised learning?',
    answer: 'Supervised learning uses labeled training data to learn a mapping from inputs to outputs (classification/regression). Examples: linear regression, SVM, decision trees. Unsupervised learning finds patterns in data without labels. Examples: clustering (K-means), dimensionality reduction (PCA), association rules.',
    course: 'Machine Learning',
    difficulty_level: 'Easy',
    mastery_level: 5,
    times_reviewed: 15,
    last_reviewed: '2024-09-22T10:45:00Z',
    next_review: '2024-09-29T10:45:00Z',
    created_at: '2024-09-08T13:30:00Z'
  },

  // Advanced Calculus Cards
  {
    id: 'card-9',
    question: 'What is a gradient vector and what does it represent?',
    answer: 'The gradient vector ∇f = (∂f/∂x, ∂f/∂y, ∂f/∂z) contains all partial derivatives of a scalar function. It points in the direction of steepest increase of the function and its magnitude represents the rate of change in that direction.',
    course: 'Advanced Calculus',
    difficulty_level: 'Medium',
    mastery_level: 4,
    times_reviewed: 8,
    last_reviewed: '2024-09-21T21:15:00Z',
    next_review: '2024-09-25T21:15:00Z',
    created_at: '2024-09-08T11:45:00Z'
  },
  {
    id: 'card-10',
    question: 'Explain the concept of a line integral.',
    answer: 'A line integral ∫C F·dr integrates a vector field F along a curve C. It represents the work done by the force field F in moving a particle along the path C. The result depends on both the vector field and the specific path taken.',
    course: 'Advanced Calculus',
    difficulty_level: 'Hard',
    mastery_level: 3,
    times_reviewed: 5,
    last_reviewed: '2024-09-20T19:30:00Z',
    next_review: '2024-09-24T19:30:00Z',
    created_at: '2024-09-07T15:20:00Z'
  },

  // Quantum Physics Cards
  {
    id: 'card-11',
    question: 'What is the Schrödinger equation and what does it describe?',
    answer: 'The Schrödinger equation iℏ∂ψ/∂t = Ĥψ is the fundamental equation of quantum mechanics. It describes how the wave function ψ of a quantum system evolves over time, where Ĥ is the Hamiltonian operator and ℏ is the reduced Planck constant.',
    course: 'Quantum Physics',
    difficulty_level: 'Hard',
    mastery_level: 3,
    times_reviewed: 6,
    last_reviewed: '2024-09-21T14:30:00Z',
    next_review: '2024-09-25T14:30:00Z',
    created_at: '2024-09-07T09:20:00Z'
  },
  {
    id: 'card-12',
    question: 'What is quantum superposition?',
    answer: 'Quantum superposition is the ability of a quantum system to exist in multiple states simultaneously until measured. For example, an electron can be in a superposition of spin-up and spin-down states: |ψ⟩ = α|↑⟩ + β|↓⟩, where |α|² + |β|² = 1.',
    course: 'Quantum Physics',
    difficulty_level: 'Medium',
    mastery_level: 4,
    times_reviewed: 9,
    last_reviewed: '2024-09-20T16:45:00Z',
    next_review: '2024-09-24T16:45:00Z',
    created_at: '2024-09-06T12:15:00Z'
  },

  // Molecular Biology Cards
  {
    id: 'card-13',
    question: 'Describe the process of DNA replication.',
    answer: 'DNA replication is semi-conservative: 1) Helicase unwinds the double helix, 2) Primase synthesizes RNA primers, 3) DNA polymerase III synthesizes the leading strand continuously and lagging strand in Okazaki fragments, 4) DNA polymerase I replaces primers with DNA, 5) DNA ligase seals the gaps.',
    course: 'Molecular Biology',
    difficulty_level: 'Hard',
    mastery_level: 3,
    times_reviewed: 7,
    last_reviewed: '2024-09-20T18:45:00Z',
    next_review: '2024-09-24T18:45:00Z',
    created_at: '2024-09-06T15:30:00Z'
  },
  {
    id: 'card-14',
    question: 'What is the central dogma of molecular biology?',
    answer: 'The central dogma states the flow of genetic information: DNA → RNA → Protein. DNA is transcribed into RNA (mRNA, tRNA, rRNA), and mRNA is translated into proteins. This describes the basic flow of genetic information in biological systems.',
    course: 'Molecular Biology',
    difficulty_level: 'Easy',
    mastery_level: 5,
    times_reviewed: 11,
    last_reviewed: '2024-09-19T14:20:00Z',
    next_review: '2024-09-26T14:20:00Z',
    created_at: '2024-09-05T10:45:00Z'
  },

  // Organic Chemistry Cards
  {
    id: 'card-15',
    question: 'What is chirality in organic chemistry?',
    answer: 'Chirality refers to molecules that are non-superimposable mirror images of each other (enantiomers). A chiral center is typically a carbon atom bonded to four different groups. Chiral molecules rotate plane-polarized light and can have different biological activities.',
    course: 'Organic Chemistry',
    difficulty_level: 'Medium',
    mastery_level: 4,
    times_reviewed: 8,
    last_reviewed: '2024-09-20T12:20:00Z',
    next_review: '2024-09-24T12:20:00Z',
    created_at: '2024-09-05T13:15:00Z'
  },
  {
    id: 'card-16',
    question: 'Explain the SN2 reaction mechanism.',
    answer: 'SN2 (Substitution Nucleophilic Bimolecular) is a one-step mechanism where the nucleophile attacks the electrophilic carbon from the backside, causing inversion of configuration. Rate = k[substrate][nucleophile]. Favored by primary carbons, strong nucleophiles, and polar aprotic solvents.',
    course: 'Organic Chemistry',
    difficulty_level: 'Hard',
    mastery_level: 3,
    times_reviewed: 6,
    last_reviewed: '2024-09-19T15:40:00Z',
    next_review: '2024-09-23T15:40:00Z',
    created_at: '2024-09-04T16:30:00Z'
  }
];

// Mock Predictions - Comprehensive Collection with CBT Support
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
        topics: ['BST', 'Tree Traversal', 'Algorithms'],
        options: null
      },
      {
        id: 2,
        question: 'What is the time complexity of inserting an element into a balanced BST?',
        type: 'objective',
        difficulty: 'medium',
        confidence: 0.89,
        topics: ['BST', 'Time Complexity'],
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correct_answer: 1
      },
      {
        id: 3,
        question: 'Explain the difference between Dijkstra\'s and Bellman-Ford algorithms.',
        type: 'theory',
        difficulty: 'hard',
        confidence: 0.87,
        topics: ['Graph Algorithms', 'Shortest Path'],
        options: null
      },
      {
        id: 4,
        question: 'Which data structure is most efficient for implementing a priority queue?',
        type: 'objective',
        difficulty: 'medium',
        confidence: 0.91,
        topics: ['Data Structures', 'Priority Queue'],
        options: ['Array', 'Linked List', 'Binary Heap', 'Hash Table'],
        correct_answer: 2
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
        question: 'Derive the gradient descent update rule for linear regression.',
        type: 'mathematical',
        difficulty: 'hard',
        confidence: 0.85,
        topics: ['Linear Regression', 'Optimization', 'Calculus'],
        options: null
      },
      {
        id: 2,
        question: 'Which activation function is most commonly used in hidden layers of deep neural networks?',
        type: 'objective',
        difficulty: 'easy',
        confidence: 0.94,
        topics: ['Neural Networks', 'Activation Functions'],
        options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'],
        correct_answer: 2
      },
      {
        id: 3,
        question: 'What is the main advantage of using ensemble methods in machine learning?',
        type: 'objective',
        difficulty: 'medium',
        confidence: 0.88,
        topics: ['Ensemble Methods', 'Model Performance'],
        options: ['Faster training', 'Better generalization', 'Less memory usage', 'Simpler interpretation'],
        correct_answer: 1
      },
      {
        id: 4,
        question: 'Compare and contrast supervised, unsupervised, and reinforcement learning paradigms.',
        type: 'theory',
        difficulty: 'medium',
        confidence: 0.91,
        topics: ['ML Types', 'Learning Paradigms'],
        options: null
      }
    ],
    confidence_score: 0.88,
    generated_at: '2024-09-21T11:45:00Z',
    status: 'completed',
    prediction_type: 'final',
    exam_date: '2024-10-15T14:00:00Z'
  },
  {
    id: 'pred-3',
    course: 'Advanced Calculus',
    questions: [
      {
        id: 1,
        question: 'Calculate the line integral ∫C F·dr where F(x,y) = (2xy, x²+y²) and C is the unit circle.',
        type: 'mathematical',
        difficulty: 'hard',
        confidence: 0.83,
        topics: ['Line Integrals', 'Vector Fields'],
        options: null
      },
      {
        id: 2,
        question: 'What does the gradient vector represent geometrically?',
        type: 'objective',
        difficulty: 'medium',
        confidence: 0.89,
        topics: ['Gradient', 'Vector Calculus'],
        options: ['Direction of steepest decrease', 'Direction of steepest increase', 'Tangent to level curves', 'Normal to the surface'],
        correct_answer: 1
      },
      {
        id: 3,
        question: 'Which theorem relates line integrals to double integrals?',
        type: 'objective',
        difficulty: 'medium',
        confidence: 0.86,
        topics: ['Theorems', 'Integration'],
        options: ['Fundamental Theorem of Calculus', 'Green\'s Theorem', 'Stokes\' Theorem', 'Divergence Theorem'],
        correct_answer: 1
      }
    ],
    confidence_score: 0.86,
    generated_at: '2024-09-20T14:20:00Z',
    status: 'completed',
    prediction_type: 'quiz',
    exam_date: '2024-09-25T10:00:00Z'
  },
  {
    id: 'pred-4',
    course: 'Quantum Physics',
    questions: [
      {
        id: 1,
        question: 'Solve the time-independent Schrödinger equation for a particle in a 1D infinite square well.',
        type: 'mathematical',
        difficulty: 'hard',
        confidence: 0.81,
        topics: ['Schrödinger Equation', 'Quantum Wells'],
        options: null
      },
      {
        id: 2,
        question: 'What is the ground state energy of a quantum harmonic oscillator?',
        type: 'objective',
        difficulty: 'medium',
        confidence: 0.87,
        topics: ['Harmonic Oscillator', 'Energy Levels'],
        options: ['0', 'ℏω/2', 'ℏω', '3ℏω/2'],
        correct_answer: 1
      },
      {
        id: 3,
        question: 'Which principle states that you cannot simultaneously know both position and momentum exactly?',
        type: 'objective',
        difficulty: 'easy',
        confidence: 0.95,
        topics: ['Quantum Principles', 'Uncertainty'],
        options: ['Pauli Exclusion Principle', 'Heisenberg Uncertainty Principle', 'Wave-Particle Duality', 'Correspondence Principle'],
        correct_answer: 1
      }
    ],
    confidence_score: 0.88,
    generated_at: '2024-09-19T16:30:00Z',
    status: 'completed',
    prediction_type: 'midterm',
    exam_date: '2024-10-05T13:00:00Z'
  },
  {
    id: 'pred-5',
    course: 'Molecular Biology',
    questions: [
      {
        id: 1,
        question: 'Describe the detailed mechanism of DNA replication, including all enzymes involved.',
        type: 'theory',
        difficulty: 'hard',
        confidence: 0.84,
        topics: ['DNA Replication', 'Enzymes'],
        options: null
      },
      {
        id: 2,
        question: 'Which enzyme is responsible for unwinding the DNA double helix during replication?',
        type: 'objective',
        difficulty: 'medium',
        confidence: 0.92,
        topics: ['DNA Replication', 'Enzymes'],
        options: ['DNA Polymerase', 'Helicase', 'Primase', 'Ligase'],
        correct_answer: 1
      },
      {
        id: 3,
        question: 'What is the direction of DNA synthesis?',
        type: 'objective',
        difficulty: 'easy',
        confidence: 0.96,
        topics: ['DNA Synthesis', 'Molecular Structure'],
        options: ['3\' to 5\'', '5\' to 3\'', 'Both directions', 'Depends on the strand'],
        correct_answer: 1
      }
    ],
    confidence_score: 0.91,
    generated_at: '2024-09-18T10:15:00Z',
    status: 'completed',
    prediction_type: 'quiz',
    exam_date: '2024-09-24T11:30:00Z'
  },
  {
    id: 'pred-6',
    course: 'Organic Chemistry',
    questions: [
      {
        id: 1,
        question: 'Predict the major product of the following SN2 reaction and explain the stereochemistry.',
        type: 'theory',
        difficulty: 'hard',
        confidence: 0.79,
        topics: ['SN2 Reactions', 'Stereochemistry'],
        options: null
      },
      {
        id: 2,
        question: 'Which solvent is best for SN2 reactions?',
        type: 'objective',
        difficulty: 'medium',
        confidence: 0.88,
        topics: ['SN2 Reactions', 'Solvents'],
        options: ['Protic polar', 'Aprotic polar', 'Nonpolar', 'Any solvent'],
        correct_answer: 1
      },
      {
        id: 3,
        question: 'What type of carbon center undergoes SN2 reactions most readily?',
        type: 'objective',
        difficulty: 'medium',
        confidence: 0.90,
        topics: ['SN2 Reactions', 'Carbon Centers'],
        options: ['Primary', 'Secondary', 'Tertiary', 'Quaternary'],
        correct_answer: 0
      }
    ],
    confidence_score: 0.86,
    generated_at: '2024-09-17T13:45:00Z',
    status: 'completed',
    prediction_type: 'exam_paper',
    exam_date: '2024-09-30T14:00:00Z'
  }
];

// Mock Study Analytics - Enhanced Version
export const mockStudyStats: StudyStats = {
  flashcards_studied_today: 47,
  cards_mastered_today: 12,
  current_streak: 18,
  best_streak: 23,
  total_study_time_today: 142, // minutes
  accuracy_rate_today: 91.8
};

// Mock Dashboard Stats - Enhanced Version
export const mockDashboardStats = {
  weeklyUploads: 12,
  weeklyTarget: 15,
  totalFlashcards: 279,
  studyStreak: 18,
  coursesProgress: [
    {
      name: 'Data Structures & Algorithms',
      progress: 92,
      uploads: 4,
      target: 4
    },
    {
      name: 'Machine Learning',
      progress: 88,
      uploads: 3,
      target: 4
    },
    {
      name: 'Advanced Calculus',
      progress: 76,
      uploads: 2,
      target: 3
    },
    {
      name: 'Quantum Physics',
      progress: 84,
      uploads: 2,
      target: 3
    },
    {
      name: 'Molecular Biology',
      progress: 81,
      uploads: 2,
      target: 3
    },
    {
      name: 'Organic Chemistry',
      progress: 79,
      uploads: 2,
      target: 3
    }
  ],
  recentActivity: [
    {
      type: 'upload' as const,
      title: 'Uploaded Advanced Machine Learning Algorithms',
      time: '2024-09-23',
      course: 'Machine Learning'
    },
    {
      type: 'study' as const,
      title: 'Completed Advanced Tree Structures deck - 14 day streak!',
      time: '2024-09-23'
    },
    {
      type: 'upload' as const,
      title: 'Uploaded Quantum Computing Fundamentals',
      time: '2024-09-23',
      course: 'Quantum Physics'
    },
    {
      type: 'flashcard' as const,
      title: 'Created Quantum Computing Basics deck',
      time: '2024-09-22',
      course: 'Quantum Physics'
    },
    {
      type: 'study' as const,
      title: 'Mastered 6 new flashcards in Deep Learning deck',
      time: '2024-09-22'
    },
    {
      type: 'upload' as const,
      title: 'Uploaded Past Exam Questions - Data Structures',
      time: '2024-09-22',
      course: 'Data Structures & Algorithms'
    },
    {
      type: 'flashcard' as const,
      title: 'Advanced ML Algorithms deck created from recent upload',
      time: '2024-09-21',
      course: 'Machine Learning'
    },
    {
      type: 'study' as const,
      title: 'Graph Algorithms Mastery - 87% accuracy achieved',
      time: '2024-09-21'
    },
    {
      type: 'upload' as const,
      title: 'Uploaded Organic Reaction Mechanisms',
      time: '2024-09-20',
      course: 'Organic Chemistry'
    },
    {
      type: 'study' as const,
      title: 'Quantum Mechanics Principles - Perfect score!',
      time: '2024-09-20'
    }
  ]
};

// CBT Question Bank - Comprehensive Collection (100+ questions)
export const mockCBTQuestions = {
  'Data Structures & Algorithms': [
    {
      id: 'cbt-ds-1',
      question: 'What is the time complexity of searching in a balanced binary search tree?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Binary Search Trees'
    },
    {
      id: 'cbt-ds-2',
      question: 'Which traversal method visits nodes in ascending order in a BST?',
      options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Tree Traversal'
    },
    {
      id: 'cbt-ds-3',
      question: 'What is the worst-case time complexity of Quick Sort?',
      options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Sorting Algorithms'
    },
    {
      id: 'cbt-ds-4',
      question: 'Which data structure is best for implementing a stack?',
      options: ['Array', 'Linked List', 'Both Array and Linked List', 'Hash Table'],
      correct_answer: 2,
      difficulty: 'easy',
      topic: 'Data Structures'
    },
    {
      id: 'cbt-ds-5',
      question: 'What is the space complexity of merge sort?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      correct_answer: 2,
      difficulty: 'medium',
      topic: 'Sorting Algorithms'
    },
    {
      id: 'cbt-ds-6',
      question: 'In a hash table, what is the purpose of a hash function?',
      options: ['Sort elements', 'Map keys to indices', 'Find duplicates', 'Count elements'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Hash Tables'
    },
    {
      id: 'cbt-ds-7',
      question: 'What happens when a hash table has too many collisions?',
      options: ['Better performance', 'Worse performance', 'No change', 'Memory overflow'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Hash Tables'
    },
    {
      id: 'cbt-ds-8',
      question: 'Which algorithm is used for finding shortest paths in a weighted graph?',
      options: ['DFS', 'BFS', 'Dijkstra\'s Algorithm', 'Quick Sort'],
      correct_answer: 2,
      difficulty: 'medium',
      topic: 'Graph Algorithms'
    },
    {
      id: 'cbt-ds-9',
      question: 'What is the time complexity of insertion in a dynamic array (ArrayList)?',
      options: ['O(1) always', 'O(n) always', 'O(1) amortized', 'O(log n)'],
      correct_answer: 2,
      difficulty: 'hard',
      topic: 'Dynamic Arrays'
    },
    {
      id: 'cbt-ds-10',
      question: 'Which data structure uses LIFO principle?',
      options: ['Queue', 'Stack', 'Linked List', 'Array'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Linear Data Structures'
    },
    {
      id: 'cbt-ds-11',
      question: 'What is the main advantage of a linked list over an array?',
      options: ['Faster access', 'Dynamic size', 'Less memory usage', 'Better cache locality'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Linked Lists'
    },
    {
      id: 'cbt-ds-12',
      question: 'In dynamic programming, what does memoization help with?',
      options: ['Memory allocation', 'Avoiding repeated calculations', 'Sorting data', 'Network communication'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Dynamic Programming'
    },
    {
      id: 'cbt-ds-13',
      question: 'What is the height of a complete binary tree with n nodes?',
      options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Binary Trees'
    },
    {
      id: 'cbt-ds-14',
      question: 'Which sorting algorithm is stable and has O(n log n) guaranteed time complexity?',
      options: ['Quick Sort', 'Heap Sort', 'Merge Sort', 'Selection Sort'],
      correct_answer: 2,
      difficulty: 'medium',
      topic: 'Sorting Algorithms'
    },
    {
      id: 'cbt-ds-15',
      question: 'What is the space complexity of the recursive implementation of binary search?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Search Algorithms'
    },
    {
      id: 'cbt-ds-16',
      question: 'In a min-heap, where is the smallest element located?',
      options: ['At any leaf', 'At the root', 'At the rightmost node', 'At the deepest level'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Heaps'
    },
    {
      id: 'cbt-ds-17',
      question: 'What is the time complexity of finding the minimum element in a min-heap?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correct_answer: 0,
      difficulty: 'easy',
      topic: 'Heaps'
    },
    {
      id: 'cbt-ds-18',
      question: 'Which technique is most suitable for solving the Longest Common Subsequence problem?',
      options: ['Greedy Algorithm', 'Dynamic Programming', 'Divide and Conquer', 'Backtracking'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Dynamic Programming'
    },
    {
      id: 'cbt-ds-19',
      question: 'What is the primary purpose of the Union-Find data structure?',
      options: ['Sorting elements', 'Managing disjoint sets', 'Implementing queues', 'String matching'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Union-Find'
    },
    {
      id: 'cbt-ds-20',
      question: 'In graph theory, what does BFS guarantee when finding paths?',
      options: ['Shortest path in weighted graphs', 'Shortest path in unweighted graphs', 'Longest path', 'Most expensive path'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Graph Algorithms'
    }
  ],
  'Machine Learning': [
    {
      id: 'cbt-ml-1',
      question: 'Which activation function is most commonly used in hidden layers?',
      options: ['Sigmoid', 'Tanh', 'ReLU', 'Linear'],
      correct_answer: 2,
      difficulty: 'easy',
      topic: 'Neural Networks'
    },
    {
      id: 'cbt-ml-2',
      question: 'What problem does the ReLU activation function solve?',
      options: ['Overfitting', 'Vanishing gradient', 'Exploding gradient', 'Local minima'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Neural Networks'
    },
    {
      id: 'cbt-ml-3',
      question: 'Which algorithm is used to train neural networks?',
      options: ['Forward propagation', 'Backpropagation', 'Gradient ascent', 'Linear regression'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Training Algorithms'
    },
    {
      id: 'cbt-ml-4',
      question: 'What is the main advantage of ensemble methods?',
      options: ['Faster training', 'Better generalization', 'Lower memory usage', 'Simpler models'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Ensemble Methods'
    },
    {
      id: 'cbt-ml-5',
      question: 'Which metric is best for imbalanced classification problems?',
      options: ['Accuracy', 'Precision', 'F1-Score', 'Mean Squared Error'],
      correct_answer: 2,
      difficulty: 'hard',
      topic: 'Model Evaluation'
    },
    {
      id: 'cbt-ml-6',
      question: 'What is the purpose of dropout in neural networks?',
      options: ['Increase speed', 'Prevent overfitting', 'Reduce parameters', 'Improve accuracy'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Regularization'
    },
    {
      id: 'cbt-ml-7',
      question: 'Which optimizer is most commonly used for training deep networks?',
      options: ['SGD', 'Adam', 'RMSprop', 'Adagrad'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Optimization'
    },
    {
      id: 'cbt-ml-8',
      question: 'What does the learning rate control in gradient descent?',
      options: ['Model complexity', 'Step size', 'Number of epochs', 'Batch size'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Optimization'
    },
    {
      id: 'cbt-ml-9',
      question: 'Which type of learning uses labeled data?',
      options: ['Supervised', 'Unsupervised', 'Reinforcement', 'Semi-supervised'],
      correct_answer: 0,
      difficulty: 'easy',
      topic: 'Learning Types'
    },
    {
      id: 'cbt-ml-10',
      question: 'What is the main purpose of cross-validation?',
      options: ['Speed up training', 'Assess model performance', 'Reduce overfitting', 'Select features'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Model Validation'
    },
    {
      id: 'cbt-ml-11',
      question: 'Which algorithm is best for clustering?',
      options: ['Linear Regression', 'K-Means', 'Decision Tree', 'SVM'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Clustering'
    },
    {
      id: 'cbt-ml-12',
      question: 'What is the curse of dimensionality?',
      options: ['Too few features', 'Too many features causing sparsity', 'Wrong feature types', 'Missing data'],
      correct_answer: 1,
      difficulty: 'hard',
      topic: 'Feature Engineering'
    },
    {
      id: 'cbt-ml-13',
      question: 'Which technique helps prevent overfitting?',
      options: ['Increasing model complexity', 'Regularization', 'More training data', 'Both B and C'],
      correct_answer: 3,
      difficulty: 'medium',
      topic: 'Regularization'
    },
    {
      id: 'cbt-ml-14',
      question: 'What is the bias-variance tradeoff?',
      options: ['Speed vs accuracy', 'Complexity vs interpretability', 'Underfitting vs overfitting', 'Training vs testing'],
      correct_answer: 2,
      difficulty: 'hard',
      topic: 'Model Theory'
    },
    {
      id: 'cbt-ml-15',
      question: 'Which evaluation metric should you use for regression problems?',
      options: ['Accuracy', 'F1-Score', 'Mean Squared Error', 'Precision'],
      correct_answer: 2,
      difficulty: 'medium',
      topic: 'Model Evaluation'
    }
  ],
  'Advanced Calculus': [
    {
      id: 'cbt-calc-1',
      question: 'What does the gradient vector represent?',
      options: ['Direction of steepest decrease', 'Direction of steepest increase', 'Tangent vector', 'Normal vector'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Vector Calculus'
    },
    {
      id: 'cbt-calc-2',
      question: 'Which theorem relates line integrals to double integrals?',
      options: ['Stokes\' Theorem', 'Green\'s Theorem', 'Divergence Theorem', 'Fundamental Theorem'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Integration Theorems'
    },
    {
      id: 'cbt-calc-3',
      question: 'What is the divergence of a vector field F = (x, y, z)?',
      options: ['0', '1', '2', '3'],
      correct_answer: 3,
      difficulty: 'easy',
      topic: 'Vector Operations'
    },
    {
      id: 'cbt-calc-4',
      question: 'When is a vector field conservative?',
      options: ['Always', 'When curl = 0', 'When div = 0', 'Never'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Conservative Fields'
    },
    {
      id: 'cbt-calc-5',
      question: 'What does the Jacobian represent in coordinate transformations?',
      options: ['Area scaling factor', 'Volume scaling factor', 'Linear transformation', 'All of the above'],
      correct_answer: 3,
      difficulty: 'hard',
      topic: 'Coordinate Transformations'
    },
    {
      id: 'cbt-calc-6',
      question: 'Which method is used to find critical points of multivariable functions?',
      options: ['Set partial derivatives to zero', 'Use the chain rule', 'Apply L\'Hôpital\'s rule', 'Use integration by parts'],
      correct_answer: 0,
      difficulty: 'medium',
      topic: 'Optimization'
    },
    {
      id: 'cbt-calc-7',
      question: 'What is the curl of a gradient field?',
      options: ['Always zero', 'Always non-zero', 'Depends on the field', 'Undefined'],
      correct_answer: 0,
      difficulty: 'medium',
      topic: 'Vector Calculus'
    },
    {
      id: 'cbt-calc-8',
      question: 'In double integration, changing the order of integration requires:',
      options: ['Nothing special', 'Changing limits of integration', 'Changing the integrand', 'Using substitution'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Multiple Integration'
    },
    {
      id: 'cbt-calc-9',
      question: 'What does the Hessian matrix help determine?',
      options: ['Gradient direction', 'Nature of critical points', 'Function value', 'Partial derivatives'],
      correct_answer: 1,
      difficulty: 'hard',
      topic: 'Second Derivative Test'
    },
    {
      id: 'cbt-calc-10',
      question: 'Which coordinate system simplifies integration over circular regions?',
      options: ['Cartesian', 'Polar', 'Spherical', 'Cylindrical'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Coordinate Systems'
    }
  ],
  'Quantum Physics': [
    {
      id: 'cbt-qp-1',
      question: 'What is the ground state energy of a quantum harmonic oscillator?',
      options: ['0', 'ℏω/2', 'ℏω', '3ℏω/2'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Quantum Harmonic Oscillator'
    },
    {
      id: 'cbt-qp-2',
      question: 'Which principle limits simultaneous measurement of position and momentum?',
      options: ['Pauli Exclusion', 'Heisenberg Uncertainty', 'Wave-Particle Duality', 'Superposition'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Quantum Principles'
    },
    {
      id: 'cbt-qp-3',
      question: 'What is the time-independent Schrödinger equation used for?',
      options: ['Finding energy eigenstates', 'Time evolution', 'Wave packet spreading', 'Tunneling calculations'],
      correct_answer: 0,
      difficulty: 'medium',
      topic: 'Schrödinger Equation'
    },
    {
      id: 'cbt-qp-4',
      question: 'In quantum mechanics, what does |ψ|² represent?',
      options: ['Energy', 'Momentum', 'Probability density', 'Wave amplitude'],
      correct_answer: 2,
      difficulty: 'easy',
      topic: 'Wave Function'
    },
    {
      id: 'cbt-qp-5',
      question: 'What happens to the wave function upon measurement?',
      options: ['It remains unchanged', 'It collapses', 'It spreads out', 'It disappears'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Measurement Theory'
    },
    {
      id: 'cbt-qp-6',
      question: 'Which quantum number determines the orbital angular momentum?',
      options: ['n', 'l', 'm', 's'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Quantum Numbers'
    },
    {
      id: 'cbt-qp-7',
      question: 'What is quantum tunneling?',
      options: ['Particle creation', 'Barrier penetration', 'Energy absorption', 'Wave interference'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Quantum Tunneling'
    },
    {
      id: 'cbt-qp-8',
      question: 'In the particle in a box model, what are the boundary conditions?',
      options: ['ψ = 0 at walls', 'ψ = 1 at walls', 'ψ is continuous', 'ψ is maximum at walls'],
      correct_answer: 0,
      difficulty: 'medium',
      topic: 'Particle in a Box'
    },
    {
      id: 'cbt-qp-9',
      question: 'What does the Pauli exclusion principle state?',
      options: ['Particles cannot be created', 'No two fermions can occupy the same quantum state', 'Energy is quantized', 'Momentum is conserved'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Pauli Exclusion'
    },
    {
      id: 'cbt-qp-10',
      question: 'What is quantum entanglement?',
      options: ['Particles moving together', 'Correlated quantum states', 'High energy states', 'Particle collision'],
      correct_answer: 1,
      difficulty: 'hard',
      topic: 'Quantum Entanglement'
    }
  ],
  'Molecular Biology': [
    {
      id: 'cbt-bio-1',
      question: 'Which enzyme unwinds the DNA double helix?',
      options: ['DNA Polymerase', 'Helicase', 'Primase', 'Ligase'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'DNA Replication'
    },
    {
      id: 'cbt-bio-2',
      question: 'In which direction does DNA synthesis occur?',
      options: ['3\' to 5\'', '5\' to 3\'', 'Both directions', 'Randomly'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'DNA Synthesis'
    },
    {
      id: 'cbt-bio-3',
      question: 'What is the central dogma of molecular biology?',
      options: ['DNA → RNA → Protein', 'RNA → DNA → Protein', 'Protein → RNA → DNA', 'DNA → Protein → RNA'],
      correct_answer: 0,
      difficulty: 'easy',
      topic: 'Central Dogma'
    },
    {
      id: 'cbt-bio-4',
      question: 'Which RNA polymerase transcribes protein-coding genes in eukaryotes?',
      options: ['RNA Polymerase I', 'RNA Polymerase II', 'RNA Polymerase III', 'All of them'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Transcription'
    },
    {
      id: 'cbt-bio-5',
      question: 'What is the function of the ribosome?',
      options: ['DNA replication', 'Transcription', 'Translation', 'RNA processing'],
      correct_answer: 2,
      difficulty: 'easy',
      topic: 'Translation'
    },
    {
      id: 'cbt-bio-6',
      question: 'Which type of RNA carries amino acids to the ribosome?',
      options: ['mRNA', 'tRNA', 'rRNA', 'snRNA'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Translation'
    },
    {
      id: 'cbt-bio-7',
      question: 'What is alternative splicing?',
      options: ['DNA repair mechanism', 'Different ways to join exons', 'Protein folding process', 'Cell division method'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'RNA Processing'
    },
    {
      id: 'cbt-bio-8',
      question: 'Where does transcription occur in eukaryotic cells?',
      options: ['Cytoplasm', 'Nucleus', 'Mitochondria', 'Endoplasmic reticulum'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Transcription'
    },
    {
      id: 'cbt-bio-9',
      question: 'What is the role of DNA ligase?',
      options: ['Unwind DNA', 'Join DNA fragments', 'Proofread DNA', 'Package DNA'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'DNA Replication'
    },
    {
      id: 'cbt-bio-10',
      question: 'Which process adds a poly-A tail to mRNA?',
      options: ['Splicing', 'Capping', 'Polyadenylation', 'Translation'],
      correct_answer: 2,
      difficulty: 'medium',
      topic: 'RNA Processing'
    }
  ],
  'Organic Chemistry': [
    {
      id: 'cbt-chem-1',
      question: 'Which carbon center undergoes SN2 reactions most readily?',
      options: ['Primary', 'Secondary', 'Tertiary', 'Quaternary'],
      correct_answer: 0,
      difficulty: 'medium',
      topic: 'Reaction Mechanisms'
    },
    {
      id: 'cbt-chem-2',
      question: 'What type of solvent favors SN2 reactions?',
      options: ['Protic polar', 'Aprotic polar', 'Nonpolar', 'Any solvent'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Solvent Effects'
    },
    {
      id: 'cbt-chem-3',
      question: 'What is the stereochemical outcome of an SN2 reaction?',
      options: ['Retention', 'Inversion', 'Racemization', 'No change'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Stereochemistry'
    },
    {
      id: 'cbt-chem-4',
      question: 'Which functional group is most electronegative?',
      options: ['Alkyl', 'Alcohol', 'Carbonyl', 'Fluorine'],
      correct_answer: 3,
      difficulty: 'easy',
      topic: 'Functional Groups'
    },
    {
      id: 'cbt-chem-5',
      question: 'What type of hybridization does a carbonyl carbon have?',
      options: ['sp³', 'sp²', 'sp', 'No hybridization'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Hybridization'
    },
    {
      id: 'cbt-chem-6',
      question: 'Which reaction converts an alkene to an alkane?',
      options: ['Oxidation', 'Reduction', 'Substitution', 'Elimination'],
      correct_answer: 1,
      difficulty: 'easy',
      topic: 'Reduction Reactions'
    },
    {
      id: 'cbt-chem-7',
      question: 'What is Markovnikov\'s rule?',
      options: ['H adds to more substituted carbon', 'H adds to less substituted carbon', 'No preference', 'Depends on solvent'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Addition Reactions'
    },
    {
      id: 'cbt-chem-8',
      question: 'Which reagent is used for ozonolysis?',
      options: ['O₂', 'O₃', 'H₂O₂', 'KMnO₄'],
      correct_answer: 1,
      difficulty: 'medium',
      topic: 'Oxidation Reactions'
    },
    {
      id: 'cbt-chem-9',
      question: 'What is the product of aldol condensation?',
      options: ['Ketone', 'α,β-unsaturated carbonyl', 'Alcohol', 'Ester'],
      correct_answer: 1,
      difficulty: 'hard',
      topic: 'Carbonyl Chemistry'
    },
    {
      id: 'cbt-chem-10',
      question: 'Which effect stabilizes carbocations?',
      options: ['Inductive effect', 'Resonance', 'Hyperconjugation', 'All of the above'],
      correct_answer: 3,
      difficulty: 'medium',
      topic: 'Carbocation Stability'
    }
  ]
};

// Utility function to add realistic delays for demo purposes
export const mockDelay = (ms: number = 800) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Plus, Play, Trophy, Flame, Target, FileText, Edit, Trash2 } from 'lucide-react';
import { TagChip } from '../TagChip';
import { CreateDeckFlow } from './flashcards/CreateDeckFlow';
import { StudyInterface } from './flashcards/StudyInterface';

interface Deck {
  id: number;
  title: string;
  description: string;
  cardCount: number;
  masteredCount: number;
  reviewedCount: number;
  progress: number;
  tags: string[];
  studyStreak: number;
  lastStudied: string;
  format: string;
  sourceFile?: string;
}

export function EnhancedFlashcardsSection() {
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [studyingDeck, setStudyingDeck] = useState<Deck | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  const decks: Deck[] = [
    {
      id: 1,
      title: "Thermodynamics Laws",
      description: "Fundamental laws and principles",
      cardCount: 25,
      masteredCount: 18,
      reviewedCount: 20,
      progress: 72,
      tags: ["PHY 101", "Thermodynamics"],
      studyStreak: 3,
      lastStudied: "2 hours ago",
      format: "Q&A",
      sourceFile: "Thermodynamics_Week4_Notes.pdf"
    },
    {
      id: 2,
      title: "Data Structures Basics",
      description: "Arrays, linked lists, stacks",
      cardCount: 32,
      masteredCount: 14,
      reviewedCount: 18,
      progress: 44,
      tags: ["CSC 202", "Data Structures"],
      studyStreak: 1,
      lastStudied: "1 day ago",
      format: "Fill-in-the-blank",
      sourceFile: "DataStructures_Chapter3.pdf"
    },
    {
      id: 3,
      title: "Engineering Mathematics",
      description: "Calculus and differential equations",
      cardCount: 18,
      masteredCount: 16,
      reviewedCount: 18,
      progress: 89,
      tags: ["ENG 301", "Mathematics"],
      studyStreak: 5,
      lastStudied: "3 hours ago",
      format: "Definitions",
      sourceFile: "Math_Formulas_Sheet.pdf"
    }
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleDeleteDeck = (deckId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Add delete logic here
    console.log('Delete deck:', deckId);
  };

  const handleEditDeck = (deck: Deck, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDeck(deck);
    console.log('Edit deck:', deck);
  };

  if (studyingDeck) {
    return (
      <StudyInterface 
        deck={studyingDeck} 
        onExit={() => setStudyingDeck(null)}
        onComplete={() => {
          setStudyingDeck(null);
          // Update deck progress here
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Flashcards</h2>
          <p className="text-gray-600">Focused recall, fast retention with smart study tracking</p>
        </div>
        <Button 
          className="bg-gray-800 hover:bg-gray-700"
          onClick={() => setShowCreateDeck(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Deck
        </Button>
      </div>

      <AnimatePresence>
        {showCreateDeck && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CreateDeckFlow 
              onClose={() => setShowCreateDeck(false)}
              onComplete={() => {
                setShowCreateDeck(false);
                // Refresh decks list
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => (
          <motion.div
            key={deck.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: deck.id * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow h-full cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Brain className="w-8 h-8 text-blue-500" />
                  <div className="flex items-center gap-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => handleEditDeck(deck, e)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-500 hover:text-red-600"
                        onClick={(e) => handleDeleteDeck(deck.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {deck.studyStreak > 0 && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Flame className="w-4 h-4" />
                        <span className="text-sm font-semibold">{deck.studyStreak}</span>
                      </div>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{deck.title}</CardTitle>
                <p className="text-gray-600 text-sm">{deck.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{deck.format}</span>
                  <span>•</span>
                  <span>{deck.cardCount} cards</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {deck.tags.map(tag => (
                      <TagChip key={tag} label={tag} color="blue" />
                    ))}
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{deck.masteredCount} of {deck.cardCount} mastered</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${getProgressColor(deck.progress)}`}
                        style={{ width: `${deck.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{deck.progress}% mastered</span>
                      <span>Reviewed {deck.reviewedCount} of {deck.cardCount}</span>
                    </div>
                  </div>

                  {deck.sourceFile && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <FileText className="w-3 h-3" />
                      <span className="truncate">{deck.sourceFile}</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">Last studied: {deck.lastStudied}</p>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gray-800 hover:bg-gray-700"
                      onClick={() => setStudyingDeck(deck)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Study
                    </Button>
                    <Button size="sm" variant="outline">
                      <Target className="w-4 h-4 mr-2" />
                      Quiz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Study Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Cards mastered today</span>
                <span className="font-semibold">23/30</span>
              </div>
              <Progress value={77} className="h-2" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Current streak: 5 days</span>
                <span>Best: 12 days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested Next</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm">Data Structures Basics</h4>
                <p className="text-xs text-gray-600">Based on prediction heatmap</p>
              </div>
              <Button variant="outline" className="w-full text-sm">
                Generate Quiz from Predictions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

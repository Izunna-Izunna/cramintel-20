
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Plus, Play, Trophy, Flame, Target } from 'lucide-react';
import { TagChip } from '../TagChip';

interface Deck {
  id: number;
  title: string;
  description: string;
  cardCount: number;
  progress: number;
  tags: string[];
  studyStreak: number;
  lastStudied: string;
}

export function EnhancedFlashcardsSection() {
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [showCreateDeck, setShowCreateDeck] = useState(false);

  const decks: Deck[] = [
    {
      id: 1,
      title: "Thermodynamics Laws",
      description: "Fundamental laws and principles",
      cardCount: 25,
      progress: 68,
      tags: ["PHY 101", "Thermodynamics"],
      studyStreak: 3,
      lastStudied: "2 hours ago"
    },
    {
      id: 2,
      title: "Data Structures Basics",
      description: "Arrays, linked lists, stacks",
      cardCount: 32,
      progress: 45,
      tags: ["CSC 202", "Data Structures"],
      studyStreak: 1,
      lastStudied: "1 day ago"
    },
    {
      id: 3,
      title: "Engineering Mathematics",
      description: "Calculus and differential equations",
      cardCount: 18,
      progress: 89,
      tags: ["ENG 301", "Mathematics"],
      studyStreak: 5,
      lastStudied: "3 hours ago"
    }
  ];

  const formatOptions = [
    { id: 'qa', name: 'Q&A', description: 'Traditional question and answer' },
    { id: 'fill', name: 'Fill-in-the-blank', description: 'Complete the missing parts' },
    { id: 'definitions', name: 'Definitions only', description: 'Term and definition pairs' },
    { id: 'mcq', name: 'Multiple Choice', description: 'Choose from options' }
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
          Create Deck
        </Button>
      </div>

      <AnimatePresence>
        {showCreateDeck && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle>Create New Deck</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Choose Format</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formatOptions.map(format => (
                      <div
                        key={format.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedFormat === format.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedFormat(format.id)}
                      >
                        <h5 className="font-medium">{format.name}</h5>
                        <p className="text-sm text-gray-600">{format.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowCreateDeck(false)}>
                    Cancel
                  </Button>
                  <Button 
                    disabled={!selectedFormat}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    Create from Materials
                  </Button>
                </div>
              </CardContent>
            </Card>
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
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Brain className="w-8 h-8 text-blue-500" />
                  <div className="flex items-center gap-2">
                    {deck.studyStreak > 0 && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Flame className="w-4 h-4" />
                        <span className="text-sm font-semibold">{deck.studyStreak}</span>
                      </div>
                    )}
                    <span className="text-sm text-gray-500">{deck.cardCount} cards</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{deck.title}</CardTitle>
                <p className="text-gray-600 text-sm">{deck.description}</p>
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
                      <span className="font-semibold">{deck.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${getProgressColor(deck.progress)}`}
                        style={{ width: `${deck.progress}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">Last studied: {deck.lastStudied}</p>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-gray-800 hover:bg-gray-700">
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

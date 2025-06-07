
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Plus, Play, Trophy, Flame, Target, FileText, Edit, Trash2 } from 'lucide-react';
import { TagChip } from '../TagChip';
import { CreateDeckFlow } from './flashcards/CreateDeckFlow';
import { StudyInterface } from './flashcards/StudyInterface';
import { useFlashcardDecks, FlashcardDeck } from '@/hooks/useFlashcardDecks';
import { useStudyAnalytics } from '@/hooks/useStudyAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export function EnhancedFlashcardsSection() {
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [studyingDeck, setStudyingDeck] = useState<FlashcardDeck | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  
  const { user } = useAuth();
  const { decks, loading: decksLoading, deleteDeck, updateDeckLastStudied } = useFlashcardDecks();
  const { stats, loading: statsLoading } = useStudyAnalytics();

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const calculateProgress = (deck: FlashcardDeck) => {
    if (deck.total_cards === 0) return 0;
    return Math.round((deck.cards_mastered / deck.total_cards) * 100);
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteDeck(deckId);
    if (success) {
      console.log('Deck deleted successfully');
    }
  };

  const handleEditDeck = (deck: FlashcardDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDeck(deck);
    console.log('Edit deck:', deck);
  };

  const handleStartStudy = async (deck: FlashcardDeck) => {
    if (deck.total_cards === 0) {
      return;
    }
    
    setStudyingDeck(deck);
    await updateDeckLastStudied(deck.id);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Please log in to access your flashcards.</p>
      </div>
    );
  }

  if (studyingDeck) {
    return (
      <StudyInterface 
        deck={studyingDeck} 
        onExit={() => setStudyingDeck(null)}
        onComplete={() => {
          setStudyingDeck(null);
          // Stats will be updated by the StudyInterface component
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
                // Decks will be refetched automatically
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {decksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No flashcard decks yet</h3>
          <p className="text-gray-600 mb-6">Create your first deck to start studying!</p>
          <Button 
            className="bg-gray-800 hover:bg-gray-700"
            onClick={() => setShowCreateDeck(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Deck
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => {
            const progress = calculateProgress(deck);
            return (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
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
                        {deck.study_streak > 0 && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Flame className="w-4 h-4" />
                            <span className="text-sm font-semibold">{deck.study_streak}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{deck.name}</CardTitle>
                    <p className="text-gray-600 text-sm">{deck.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{deck.format}</span>
                      <span>•</span>
                      <span>{deck.total_cards} cards</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-1">
                        {deck.tags?.map(tag => (
                          <TagChip key={tag} label={tag} color="blue" />
                        ))}
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">{deck.cards_mastered} of {deck.total_cards} mastered</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{progress}% mastered</span>
                          <span>Total: {deck.total_cards}</span>
                        </div>
                      </div>

                      {deck.source_materials && deck.source_materials.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{deck.source_materials[0]}</span>
                          {deck.source_materials.length > 1 && (
                            <span>+{deck.source_materials.length - 1} more</span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Last studied: {formatTimeAgo(deck.last_studied)}
                      </p>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gray-800 hover:bg-gray-700"
                          onClick={() => handleStartStudy(deck)}
                          disabled={deck.total_cards === 0}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Study
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={deck.total_cards === 0}
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Quiz
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Study Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Cards studied today</span>
                  <span className="font-semibold">{stats.flashcards_studied_today}</span>
                </div>
                <Progress value={Math.min((stats.flashcards_studied_today / 30) * 100, 100)} className="h-2" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Current streak: {stats.current_streak} days</span>
                  <span>Best: {stats.best_streak} days</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested Next</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {decks.length > 0 ? (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-sm">{decks[0].name}</h4>
                    <p className="text-xs text-gray-600">Based on study patterns</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full text-sm"
                    onClick={() => handleStartStudy(decks[0])}
                    disabled={decks[0].total_cards === 0}
                  >
                    Start Studying
                  </Button>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <p className="text-sm">Create a deck to get started!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

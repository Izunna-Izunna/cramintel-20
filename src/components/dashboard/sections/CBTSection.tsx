import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Clock, Target, Play, BarChart3, Users, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMaterials } from '@/hooks/useMaterials';
import { usePredictions } from '@/hooks/usePredictions';
import { useAuth } from '@/hooks/useAuth';
import { CBTExamInterface } from './predictions/CBTExamInterface';
import { CBTResultsView } from './predictions/CBTResultsView';
import { GeneratedQuestion } from '@/types/predictions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CramIntelLogo from '@/components/CramIntelLogo';

export function CBTSection() {
  const { materialGroups, loading } = useMaterials();
  const { predictions } = usePredictions();
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [examMode, setExamMode] = useState<'selection' | 'exam' | 'results'>('selection');
  const [examQuestions, setExamQuestions] = useState<GeneratedQuestion[]>([]);
  const [examResults, setExamResults] = useState<{
    answers: Record<number, string>;
    timeSpent: number;
  } | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Get unique courses from materials
  const courses = Array.from(
    new Set(
      materialGroups
        .flatMap(group => group.materials)
        .map(material => material.course)
        .filter(Boolean)
    )
  );

  // Get existing objective questions for a course from predictions
  const getExistingQuestions = (course: string): GeneratedQuestion[] => {
    const coursePredictions = predictions.filter(
      p => p.course === course && 
      p.prediction_type === 'objective_bulk' && 
      p.status === 'active'
    );

    const questions: GeneratedQuestion[] = [];
    coursePredictions.forEach(prediction => {
      if (Array.isArray(prediction.questions)) {
        prediction.questions.forEach(q => {
          if (q.options && q.correct_answer) {
            questions.push(q);
          }
        });
      }
    });

    return questions;
  };

  // Generate new questions using OpenAI
  const generateNewQuestions = async (course: string): Promise<GeneratedQuestion[]> => {
    if (!user) {
      toast.error('Please log in to generate questions');
      return [];
    }

    try {
      setGeneratingQuestions(true);
      toast.info('Generating CBT questions from your materials...');

      // Get materials for this course
      const courseMaterials = materialGroups
        .flatMap(group => group.materials)
        .filter(material => material.course === course);

      if (courseMaterials.length === 0) {
        toast.error('No materials found for this course');
        return [];
      }

      // Prepare clues for generation
      const clues = courseMaterials.map(material => ({
        id: material.id,
        name: material.name,
        type: 'assignment' as const,
        materialId: material.id
      }));

      const requestBody = {
        clues,
        context: {
          course,
          materials: courseMaterials.map(m => ({ name: m.name, type: m.material_type })),
        },
        style: 'objective_bulk' as const
      };

      const { data, error } = await supabase.functions.invoke('generate-predictions', {
        body: requestBody
      });

      if (error) {
        console.error('Error generating questions:', error);
        toast.error('Failed to generate questions. Please try again.');
        return [];
      }

      const questions = data?.data?.predictions || [];
      
      if (questions.length === 0) {
        toast.error('No questions could be generated from your materials');
        return [];
      }

      toast.success(`Generated ${questions.length} CBT questions!`);
      return questions;
    } catch (error) {
      console.error('Error in question generation:', error);
      toast.error('Failed to generate questions. Please try again.');
      return [];
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleStartExam = async (course: string) => {
    setSelectedCourse(course);
    
    // First, try to get existing questions
    let questions = getExistingQuestions(course);
    
    // If we have fewer than 10 questions, generate new ones
    if (questions.length < 10) {
      const newQuestions = await generateNewQuestions(course);
      questions = [...questions, ...newQuestions];
    }
    
    // Take up to 25 questions for the exam
    const examQuestions = questions.slice(0, 25);
    
    if (examQuestions.length === 0) {
      toast.error('No questions available for this course. Please upload some materials first.');
      return;
    }
    
    setExamQuestions(examQuestions);
    setExamMode('exam');
  };

  const handleExamComplete = (answers: Record<number, string>, timeSpent: number) => {
    setExamResults({ answers, timeSpent });
    setExamMode('results');
  };

  const handleBackToSelection = () => {
    setExamMode('selection');
    setSelectedCourse(null);
    setExamQuestions([]);
    setExamResults(null);
  };

  const handleRetakeExam = () => {
    setExamMode('exam');
    setExamResults(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wrlds-dark mx-auto mb-4"></div>
          <p className="text-wrlds-accent font-space">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (examMode === 'exam' && selectedCourse && examQuestions.length > 0) {
    return (
      <CBTExamInterface
        questions={examQuestions}
        examTitle={`${selectedCourse} Practice Exam`}
        timeLimit={45} // 45 minutes for CBT
        onComplete={handleExamComplete}
        onExit={handleBackToSelection}
      />
    );
  }

  if (examMode === 'results' && selectedCourse && examQuestions.length > 0 && examResults) {
    return (
      <CBTResultsView
        questions={examQuestions}
        answers={examResults.answers}
        timeSpent={examResults.timeSpent}
        examTitle={`${selectedCourse} Practice Exam`}
        onRetakeExam={handleRetakeExam}
        onBackToQuestions={handleBackToSelection}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="bg-gradient-to-r from-wrlds-dark to-gray-800 text-white rounded-2xl p-8 mb-6 border border-wrlds-accent/20">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center mb-4"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/20">
              <BarChart3 className="w-12 h-12" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold font-space mb-2">
            Computer Based Testing
          </h1>
          <p className="text-xl opacity-90 font-space">
            AI-powered exam simulations from your study materials
          </p>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-wrlds-accent/20 shadow-sm">
          <CardContent className="p-4 text-center">
            <Book className="w-8 h-8 text-wrlds-dark mx-auto mb-2" />
            <p className="text-2xl font-bold text-wrlds-dark font-space">{courses.length}</p>
            <p className="text-sm text-wrlds-accent font-space">Available Courses</p>
          </CardContent>
        </Card>
        <Card className="border-wrlds-accent/20 shadow-sm">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-wrlds-dark mx-auto mb-2" />
            <p className="text-2xl font-bold text-wrlds-dark font-space">
              {predictions.filter(p => p.prediction_type === 'objective_bulk').length}
            </p>
            <p className="text-sm text-wrlds-accent font-space">Question Banks</p>
          </CardContent>
        </Card>
        <Card className="border-wrlds-accent/20 shadow-sm">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-wrlds-dark font-space">0h</p>
            <p className="text-sm text-wrlds-accent font-space">Practice Time</p>
          </CardContent>
        </Card>
        <Card className="border-wrlds-accent/20 shadow-sm">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-wrlds-dark font-space">0%</p>
            <p className="text-sm text-wrlds-accent font-space">Average Score</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Course Selection */}
      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-center p-8 border-wrlds-accent/20 shadow-sm">
            <CardContent>
              <Users className="w-16 h-16 text-wrlds-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-wrlds-dark mb-2 font-space">No Courses Available</h3>
              <p className="text-wrlds-accent mb-6 font-space">
                Upload some course materials first to generate CBT questions and start practicing.
              </p>
              <Button
                onClick={() => {/* Navigate to upload section */}}
                className="bg-wrlds-dark hover:bg-gray-800 font-space"
              >
                Upload Materials
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-wrlds-accent/20 shadow-sm">
            <CardHeader>
              <CardTitle className="font-space text-wrlds-dark">Select a Course for CBT Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course, index) => {
                  const courseMaterials = materialGroups
                    .flatMap(group => group.materials)
                    .filter(material => material.course === course);
                  
                  const existingQuestions = getExistingQuestions(course);
                  
                  return (
                    <motion.div
                      key={course}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-wrlds-accent/20">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Book className="w-8 h-8 text-wrlds-dark" />
                            <div className="text-right">
                              <span className="text-sm text-wrlds-accent font-space block">
                                {courseMaterials.length} materials
                              </span>
                              <span className="text-xs text-green-600 font-space">
                                {existingQuestions.length} questions ready
                              </span>
                            </div>
                          </div>
                          <h3 className="font-semibold text-wrlds-dark mb-2 group-hover:text-gray-700 transition-colors font-space">
                            {course}
                          </h3>
                          <p className="text-sm text-wrlds-accent mb-4 font-space">
                            {existingQuestions.length > 0 
                              ? `Practice with ${existingQuestions.length} AI-generated questions`
                              : 'Generate fresh questions from your materials'
                            }
                          </p>
                          <Button
                            onClick={() => handleStartExam(course)}
                            disabled={generatingQuestions}
                            className="w-full bg-gradient-to-r from-wrlds-dark to-gray-800 hover:from-gray-800 hover:to-black font-space disabled:opacity-50"
                          >
                            {generatingQuestions ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Start CBT
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* CBT Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-wrlds-accent/20 shadow-sm">
          <CardHeader>
            <CardTitle className="font-space text-wrlds-dark">CBT Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <BarChart3 className="w-5 h-5 text-wrlds-dark mt-1" />
                <div>
                  <h4 className="font-medium text-wrlds-dark font-space">AI-Generated Questions</h4>
                  <p className="text-sm text-wrlds-accent font-space">Questions generated from your actual study materials using advanced AI</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-wrlds-dark mt-1" />
                <div>
                  <h4 className="font-medium text-wrlds-dark font-space">Realistic Timing</h4>
                  <p className="text-sm text-wrlds-accent font-space">Practice with authentic exam time constraints and pressure</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-wrlds-dark mt-1" />
                <div>
                  <h4 className="font-medium text-wrlds-dark font-space">Smart Question Selection</h4>
                  <p className="text-sm text-wrlds-accent font-space">Questions selected based on confidence scores and topic coverage</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Award className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-medium text-wrlds-dark font-space">Performance Analytics</h4>
                  <p className="text-sm text-wrlds-accent font-space">Detailed analysis of your performance and areas for improvement</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Clock, Target, Play, BarChart3, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMaterials } from '@/hooks/useMaterials';
import { CBTExamInterface } from './predictions/CBTExamInterface';
import { CBTResultsView } from './predictions/CBTResultsView';
import { GeneratedQuestion } from '@/types/predictions';
import CramIntelLogo from '@/components/CramIntelLogo';

export function CBTSection() {
  const { materialGroups, loading } = useMaterials();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [examMode, setExamMode] = useState<'selection' | 'exam' | 'results'>('selection');
  const [examQuestions, setExamQuestions] = useState<GeneratedQuestion[]>([]);
  const [examResults, setExamResults] = useState<{
    answers: Record<number, string>;
    timeSpent: number;
  } | null>(null);

  // Get unique courses from materials
  const courses = Array.from(
    new Set(
      materialGroups
        .flatMap(group => group.materials)
        .map(material => material.course)
        .filter(Boolean)
    )
  );

  // Mock exam questions for demo (in real app, these would come from generated predictions)
  const generateMockQuestions = (course: string): GeneratedQuestion[] => {
    return [
      {
        question: `What is the primary concept in ${course}?`,
        options: [
          'A) First option related to the course',
          'B) Second option that might be correct',
          'C) Third option for consideration',
          'D) Fourth option as alternative'
        ],
        correct_answer: 'A) First option related to the course',
        topic: course,
        confidence: 85,
        difficulty: 'medium'
      },
      {
        question: `Which principle is fundamental in ${course} studies?`,
        options: [
          'A) Basic principle one',
          'B) Advanced concept two',
          'C) Intermediate idea three',
          'D) Complex theory four'
        ],
        correct_answer: 'B) Advanced concept two',
        topic: course,
        confidence: 90,
        difficulty: 'hard'
      },
      {
        question: `How do you apply ${course} concepts in practice?`,
        options: [
          'A) Through theoretical analysis only',
          'B) By combining theory and practical application',
          'C) Using only practical methods',
          'D) Avoiding theoretical frameworks'
        ],
        correct_answer: 'B) By combining theory and practical application',
        topic: course,
        confidence: 78,
        difficulty: 'medium'
      }
    ];
  };

  const handleStartExam = (course: string) => {
    setSelectedCourse(course);
    setExamQuestions(generateMockQuestions(course));
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
        timeLimit={30} // 30 minutes default
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
            Practice with realistic exam simulations
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
            <p className="text-2xl font-bold text-wrlds-dark font-space">0</p>
            <p className="text-sm text-wrlds-accent font-space">Tests Completed</p>
          </CardContent>
        </Card>
        <Card className="border-wrlds-accent/20 shadow-sm">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-wrlds-dark font-space">0h</p>
            <p className="text-sm text-wrlds-accent font-space">Study Time</p>
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
                            <span className="text-sm text-wrlds-accent font-space">
                              {courseMaterials.length} materials
                            </span>
                          </div>
                          <h3 className="font-semibold text-wrlds-dark mb-2 group-hover:text-gray-700 transition-colors font-space">
                            {course}
                          </h3>
                          <p className="text-sm text-wrlds-accent mb-4 font-space">
                            Practice with AI-generated questions based on your uploaded materials
                          </p>
                          <Button
                            onClick={() => handleStartExam(course)}
                            className="w-full bg-gradient-to-r from-wrlds-dark to-gray-800 hover:from-gray-800 hover:to-black font-space"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start CBT
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

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-wrlds-accent/20 shadow-sm">
          <CardHeader>
            <CardTitle className="font-space text-wrlds-dark">CBT Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-wrlds-dark mt-1" />
                <div>
                  <h4 className="font-medium text-wrlds-dark font-space">Time Management</h4>
                  <p className="text-sm text-wrlds-accent font-space">Practice with realistic time limits to improve your exam performance</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-wrlds-dark mt-1" />
                <div>
                  <h4 className="font-medium text-wrlds-dark font-space">Focus Areas</h4>
                  <p className="text-sm text-wrlds-accent font-space">Questions are generated from your uploaded materials and weak spots</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <BarChart3 className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-wrlds-dark font-space">Track Progress</h4>
                  <p className="text-sm text-wrlds-accent font-space">Monitor your improvement across multiple practice sessions</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Award className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-medium text-wrlds-dark font-space">Realistic Experience</h4>
                  <p className="text-sm text-wrlds-accent font-space">Simulate actual exam conditions with our CBT interface</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

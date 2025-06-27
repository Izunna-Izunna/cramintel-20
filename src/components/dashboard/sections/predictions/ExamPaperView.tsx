
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, FileText, Clock, BookOpen, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GeneratedQuestion, ExamSection, PredictionStyle } from '@/types/predictions';

interface PredictionData {
  clues: Array<{
    id: string;
    name: string;
    type: 'past-questions' | 'assignment' | 'whisper';
    content?: string;
    materialId?: string;
  }>;
  context: {
    course: string;
    topics: string[];
    lecturer?: string;
  };
  style: PredictionStyle;
  generatedContent?: {
    exam_title?: string;
    duration?: string;
    instructions?: string;
    sections?: ExamSection[];
    total_marks?: number;
    predictions?: GeneratedQuestion[];
    overall_confidence?: number;
    study_guide?: {
      priority_1: string[];
      priority_2: string[];
      priority_3: string[];
    };
  };
}

interface ExamPaperViewProps {
  predictionData: PredictionData;
  onBack: () => void;
  onClose: () => void;
}

export function ExamPaperView({ predictionData, onBack, onClose }: ExamPaperViewProps) {
  const [activeTab, setActiveTab] = useState<'exam' | 'study-guide'>('exam');

  const examData = predictionData.generatedContent;
  const hasExamStructure = examData?.sections && examData.sections.length > 0;
  const hasStudyGuide = examData?.study_guide;

  const exportExamPaper = () => {
    let content = '';
    
    if (examData?.exam_title) {
      content += `${examData.exam_title}\n`;
      content += '='.repeat(examData.exam_title.length) + '\n\n';
    }
    
    if (examData?.duration) {
      content += `Duration: ${examData.duration}\n`;
    }
    
    if (examData?.total_marks) {
      content += `Total Marks: ${examData.total_marks}\n\n`;
    }
    
    if (examData?.instructions) {
      content += `Instructions:\n${examData.instructions}\n\n`;
      content += '-'.repeat(50) + '\n\n';
    }

    if (hasExamStructure) {
      examData.sections?.forEach((section, sectionIndex) => {
        content += `SECTION ${sectionIndex + 1}: ${section.title}\n`;
        content += '-'.repeat(30) + '\n\n';
        
        section.questions.forEach((question, questionIndex) => {
          content += `Question ${questionIndex + 1}`;
          if (question.marks) {
            content += ` [${question.marks} marks]`;
          }
          content += `\n${question.question}\n\n`;
          
          if (question.options) {
            question.options.forEach(option => {
              content += `${option}\n`;
            });
            content += '\n';
          }
        });
        
        content += '\n';
      });
    } else if (examData?.predictions) {
      examData.predictions.forEach((question, index) => {
        content += `Question ${index + 1}`;
        if (question.marks) {
          content += ` [${question.marks} marks]`;
        }
        content += `\n${question.question}\n\n`;
        
        if (question.options) {
          question.options.forEach(option => {
            content += `${option}\n`;
          });
          content += '\n';
        }
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examData?.exam_title || predictionData.context.course}_Exam_Paper.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderExamContent = () => {
    if (hasExamStructure) {
      return (
        <div className="space-y-8">
          {examData.sections?.map((section, sectionIndex) => (
            <Card key={sectionIndex} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-xl">
                  Section {sectionIndex + 1}: {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {section.questions.map((question, questionIndex) => (
                    <motion.div
                      key={questionIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: questionIndex * 0.1 }}
                      className="border-l-4 border-teal-500 pl-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">
                          Question {questionIndex + 1}
                        </h4>
                        <div className="flex gap-2">
                          {question.marks && (
                            <Badge variant="secondary">
                              {question.marks} marks
                            </Badge>
                          )}
                          {question.difficulty && (
                            <Badge variant={
                              question.difficulty === 'easy' ? 'default' :
                              question.difficulty === 'medium' ? 'secondary' : 'destructive'
                            }>
                              {question.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {question.question}
                      </p>

                      {question.options && (
                        <div className="ml-4 space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <p key={optionIndex} className="text-gray-600">
                              {option}
                            </p>
                          ))}
                        </div>
                      )}

                      {question.formula && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-1">Formula:</p>
                          <code className="text-blue-700">{question.formula}</code>
                        </div>
                      )}

                      {question.constants && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                          <p className="text-sm font-medium text-amber-800 mb-1">Constants:</p>
                          <p className="text-amber-700 text-sm">{question.constants}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    } else if (examData?.predictions) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Exam Questions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {examData.predictions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-l-4 border-teal-500 pl-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">
                      Question {index + 1}
                    </h4>
                    <div className="flex gap-2">
                      {question.marks && (
                        <Badge variant="secondary">
                          {question.marks} marks
                        </Badge>
                      )}
                      {question.confidence && (
                        <Badge variant="outline">
                          {Math.round(question.confidence)}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {question.question}
                  </p>

                  {question.options && (
                    <div className="ml-4 space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <p key={optionIndex} className="text-gray-600">
                          {option}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Exam Content Available</h3>
            <p className="text-gray-600">
              The exam paper could not be generated. Please try again with different materials.
            </p>
          </CardContent>
        </Card>
      );
    }
  };

  const renderStudyGuide = () => {
    if (!hasStudyGuide) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Study Guide Available</h3>
            <p className="text-gray-600">
              Study recommendations were not generated for this exam paper.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-red-500" />
              High Priority Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {examData.study_guide?.priority_1.map((topic, index) => (
                <Badge key={index} variant="destructive" className="mr-2 mb-2">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Medium Priority Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {examData.study_guide?.priority_2.map((topic, index) => (
                <Badge key={index} variant="secondary" className="mr-2 mb-2">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              Low Priority Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {examData.study_guide?.priority_3.map((topic, index) => (
                <Badge key={index} variant="outline" className="mr-2 mb-2">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {examData?.exam_title || `${predictionData.context.course} Exam Paper`}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {examData?.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {examData.duration}
                </span>
              )}
              {examData?.total_marks && (
                <span>Total Marks: {examData.total_marks}</span>
              )}
              {examData?.overall_confidence && (
                <Badge variant="outline">
                  {Math.round(examData.overall_confidence)}% confidence
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={exportExamPaper}>
            <Download className="w-4 h-4 mr-2" />
            Export Paper
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'exam'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Exam Paper
          </button>
          {hasStudyGuide && (
            <button
              onClick={() => setActiveTab('study-guide')}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'study-guide'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Study Guide
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      {examData?.instructions && activeTab === 'exam' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {examData.instructions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="mb-8">
        {activeTab === 'exam' ? renderExamContent() : renderStudyGuide()}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Style Selection
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportExamPaper}>
            <Download className="w-4 h-4 mr-2" />
            Export Paper
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

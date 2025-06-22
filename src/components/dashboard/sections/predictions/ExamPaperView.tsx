
import React from 'react';
import { motion } from 'framer-motion';
import { Download, Printer, Clock, Users, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExamSection, GeneratedQuestion, PredictionResponse } from '@/types/predictions';
import 'katex/dist/katex.min.css';

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
  style: 'bullet' | 'theory' | 'mixed' | 'exam-paper' | 'ranked' | 'practice_exam' | 'topic_based';
  generatedContent?: PredictionResponse;
}

interface ExamPaperViewProps {
  predictionData: PredictionData;
  onBack: () => void;
  onClose: () => void;
}

export function ExamPaperView({ predictionData, onBack, onClose }: ExamPaperViewProps) {
  console.log('ExamPaperView received data:', predictionData);
  
  // Extract real exam paper data from generated content
  const examData = predictionData.generatedContent;
  
  // Use real data or create fallback structure
  const examHeader = {
    course: examData?.exam_title || `${predictionData.context.course} Final Examination`,
    duration: examData?.duration || "2-3 hours",
    instruction: examData?.instructions || "Answer ALL questions in Section A, and ANY TWO questions in Section B"
  };

  // Use real sections from AI or create fallback
  const examSections = examData?.sections || [
    {
      title: "Section A - Generated Questions",
      questions: examData?.predictions?.map((pred, index) => ({
        question: pred.question,
        type: pred.type || "theory",
        marks: pred.marks || 15,
        confidence: pred.confidence || 75
      })) || [
        {
          question: `No exam content was generated. Please try again with different materials.`,
          type: "error",
          marks: 0,
          confidence: 0
        }
      ]
    }
  ];

  console.log('Exam sections:', examSections);

  const renderMathFormula = (formula: string) => {
    return (
      <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-800">
        {formula}
      </span>
    );
  };

  const renderQuestion = (question: GeneratedQuestion, questionNumber: number, sectionIndex: number) => {
    const marks = question.marks || 10;
    
    return (
      <div key={`${sectionIndex}-${questionNumber}`} className="border-l-4 border-blue-200 pl-4 mb-6">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-800">
            {questionNumber}. {question.question}
          </h4>
          <Badge variant="outline">[{marks} marks]</Badge>
        </div>
        
        {question.formula && (
          <div className="mt-2 mb-2">
            <span className="text-sm text-gray-600">Use: </span>
            {renderMathFormula(question.formula)}
          </div>
        )}
        
        {question.constants && (
          <div className="mt-1 mb-2">
            <span className="text-sm text-gray-600">Given: </span>
            <span className="font-mono text-sm">{question.constants}</span>
          </div>
        )}
        
        {question.instruction && (
          <p className="text-sm italic text-gray-600 mt-2">
            {question.instruction}
          </p>
        )}

        {question.hint && (
          <div className="mt-2 mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <span className="text-sm text-yellow-800">💡 Hint: "{question.hint}"</span>
          </div>
        )}
        
        {question.type === 'calculation' && (
          <div className="mt-3 p-3 bg-gray-50 rounded border-dashed border-2 border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Working space:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div>Given: ________________</div>
              <div>Formula: _______________</div>
              <div>Substitution: __________</div>
              <div className="border-2 border-blue-300 p-2 bg-blue-50">
                <strong>Final Answer: _______</strong>
              </div>
            </div>
          </div>
        )}

        {question.subtopics && (
          <div className="mt-3">
            <ul className="space-y-2 ml-4">
              {question.subtopics.map((topic, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-gray-600 mr-2">({String.fromCharCode(97 + idx)})</span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(question.type === 'derivation' || question.type === 'applied') && (
          <div className="mt-3 p-4 bg-gray-50 rounded border-dashed border-2 border-gray-200 min-h-[100px]">
            <p className="text-xs text-gray-500 mb-2">Solution space:</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Generated Exam Paper</h3>
            <p className="text-gray-600">Based on your {predictionData.context.course} materials</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </motion.div>

      <Card className="mb-6">
        <CardContent className="p-8">
          {/* Exam Header */}
          <div className="text-center border-b-2 border-gray-200 pb-6 mb-8">
            <h1 className="text-2xl font-bold mb-2">CramIntel Smart Prediction Engine</h1>
            <h2 className="text-xl font-semibold mb-4">{examHeader.course}</h2>
            <div className="flex justify-center gap-8 text-sm text-gray-600 mb-4">
              <span>Duration: {examHeader.duration}</span>
              {examData?.total_marks && <span>Total Marks: {examData.total_marks}</span>}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="font-medium text-gray-800">
                <strong>Instructions:</strong> {examHeader.instruction}
              </p>
            </div>
          </div>

          {/* Render Real Exam Sections */}
          {examSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-xl font-bold text-gray-800">{section.title}</h3>
                <Badge variant="secondary">
                  {section.questions.length} Question{section.questions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="space-y-6">
                {section.questions.map((question, questionIndex) => 
                  renderQuestion(question, questionIndex + 1, sectionIndex)
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Button variant="outline" size="sm" className="justify-start">
          <Clock className="w-4 h-4 mr-2" />
          Practice Mode
        </Button>
        <Button variant="outline" size="sm" className="justify-start">
          <Calculator className="w-4 h-4 mr-2" />
          Show Solutions
        </Button>
        <Button variant="outline" size="sm" className="justify-start">
          <Users className="w-4 h-4 mr-2" />
          Share with Circle
        </Button>
        <Button variant="outline" size="sm" className="justify-start">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Generate Again
        </Button>
        <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
          Done
        </Button>
      </div>
    </div>
  );
}

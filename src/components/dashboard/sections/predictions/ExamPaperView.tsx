
import React from 'react';
import { motion } from 'framer-motion';
import { Download, Printer, Clock, Users, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import 'katex/dist/katex.min.css';

interface PredictionData {
  clues: Array<{
    id: string;
    name: string;
    type: 'past-questions' | 'assignment' | 'whisper';
    content?: string;
  }>;
  context: {
    course: string;
    topics: string[];
    lecturer?: string;
  };
  style: 'bullet' | 'theory' | 'mixed' | 'exam-paper';
}

interface ExamPaperViewProps {
  predictionData: PredictionData;
  onBack: () => void;
  onClose: () => void;
}

export function ExamPaperView({ predictionData, onBack, onClose }: ExamPaperViewProps) {
  const examHeader = {
    course: predictionData.context.course || "MEE302 – Applied Thermodynamics",
    level: "300",
    semester: "2nd",
    duration: "2 hrs",
    instruction: "Answer any FOUR questions from Section A and TWO from Section B."
  };

  const sectionAQuestions = [
    {
      id: 1,
      text: "Define thermal efficiency and explain how it applies to a Rankine cycle.",
      type: "theory",
      marks: 5
    },
    {
      id: 2,
      text: "A closed system contains 2 kg of air at 27°C and 1.5 bar. Using the Ideal Gas Law, calculate the volume of the air.",
      formula: "PV = nRT",
      constants: "R = 0.287 kJ/kg·K",
      instruction: "Show all working.",
      type: "calculation",
      marks: 8
    },
    {
      id: 3,
      text: "Differentiate between internal energy and enthalpy. Provide one equation where each term appears.",
      type: "theory",
      marks: 6
    },
    {
      id: 4,
      text: "Calculate the work done during an isothermal expansion of 0.5 kg of air from 2 bar to 0.8 bar at 300K.",
      formula: "W = mRT ln(P₁/P₂)",
      type: "calculation",
      marks: 10
    }
  ];

  const sectionBQuestions = [
    {
      id: 1,
      text: "Derive the formula for isentropic work done during compression of an ideal gas. Give assumptions used.",
      type: "derivation",
      marks: 15
    },
    {
      id: 2,
      text: "A piston-cylinder device undergoes a reversible adiabatic compression from 100 kPa and 0.1 m³ to 500 kPa. If γ = 1.4, find the final volume and work done.",
      formula: "W = (P₂V₂ - P₁V₁)/(1-γ)",
      type: "applied",
      marks: 20
    },
    {
      id: 3,
      text: "Based on the last assignment, explain the concept of nozzle choking in compressible flow, and state the condition for choking.",
      type: "applied",
      marks: 15
    }
  ];

  const sectionCQuestions = [
    {
      id: 1,
      text: "Write short notes on:",
      subtopics: ["Regenerative Rankine Cycle", "Carnot Efficiency Limit", "Polytropic Compression"],
      hint: "Chapter 4 will be key",
      type: "notes",
      marks: 15
    }
  ];

  const renderMathFormula = (formula: string) => {
    return (
      <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-800">
        {formula}
      </span>
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
            <p className="text-gray-600">Professional format with calculations</p>
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
            <h2 className="text-xl font-semibold mb-4">Course: {examHeader.course}</h2>
            <div className="flex justify-center gap-8 text-sm text-gray-600 mb-4">
              <span>Level: {examHeader.level}</span>
              <span>Semester: {examHeader.semester}</span>
              <span>Duration: {examHeader.duration}</span>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="font-medium text-gray-800">
                <strong>Instruction:</strong> {examHeader.instruction}
              </p>
            </div>
          </div>

          {/* Section A */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-gray-800">SECTION A</h3>
              <Badge variant="secondary">Theory + Short Calculations</Badge>
            </div>
            
            <div className="space-y-6">
              {sectionAQuestions.map((question, index) => (
                <div key={question.id} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {index + 1}. {question.text}
                    </h4>
                    <Badge variant="outline">[{question.marks} marks]</Badge>
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
                </div>
              ))}
            </div>
          </div>

          {/* Section B */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-gray-800">SECTION B</h3>
              <Badge variant="secondary">Derivations, Proofs, and Applied Problems</Badge>
            </div>
            
            <div className="space-y-6">
              {sectionBQuestions.map((question, index) => (
                <div key={question.id} className="border-l-4 border-green-200 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {index + 1}. {question.text}
                    </h4>
                    <Badge variant="outline">[{question.marks} marks]</Badge>
                  </div>
                  
                  {question.formula && (
                    <div className="mt-2 mb-2">
                      <span className="text-sm text-gray-600">Use: </span>
                      {renderMathFormula(question.formula)}
                    </div>
                  )}
                  
                  <div className="mt-3 p-4 bg-gray-50 rounded border-dashed border-2 border-gray-200 min-h-[100px]">
                    <p className="text-xs text-gray-500 mb-2">Solution space:</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section C */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-gray-800">SECTION C</h3>
              <Badge variant="secondary">Based on Class Whispers / Lecturer Trends</Badge>
            </div>
            
            <div className="space-y-6">
              {sectionCQuestions.map((question, index) => (
                <div key={question.id} className="border-l-4 border-purple-200 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {index + 1}. {question.text}
                    </h4>
                    <Badge variant="outline">[{question.marks} marks]</Badge>
                  </div>
                  
                  {question.hint && (
                    <div className="mt-2 mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <span className="text-sm text-yellow-800">💡 Lecturer hint: "{question.hint}"</span>
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
                </div>
              ))}
            </div>
          </div>
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

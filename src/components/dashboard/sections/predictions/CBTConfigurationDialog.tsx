import React, { useState } from 'react';
import { Clock, Target, Settings, AlertCircle, Sparkles, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQuestionHistory } from '@/hooks/useQuestionHistory';

interface CBTConfigurationDialogProps {
  courses: string[];
  availableQuestions: Record<string, number>;
  onStartExam: (config: ExamConfiguration) => void;
  isGenerating: boolean;
  onGenerateQuestions?: (course: string) => Promise<void>;
  materialCounts?: Record<string, number>;
}

export interface ExamConfiguration {
  course: string;
  timeLimit: number; // in minutes
  questionCount: number;
}

export function CBTConfigurationDialog({ 
  courses, 
  availableQuestions, 
  onStartExam, 
  isGenerating,
  onGenerateQuestions,
  materialCounts = {}
}: CBTConfigurationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState([25]); // Default 25 minutes
  const [questionCount, setQuestionCount] = useState([20]); // Default 20 questions
  const [generatingForCourse, setGeneratingForCourse] = useState<string>('');

  const maxQuestions = selectedCourse ? Math.min(availableQuestions[selectedCourse] || 0, 70) : 70;
  const estimatedMinPerQuestion = timeLimit[0] / questionCount[0];
  const materialCount = selectedCourse ? materialCounts[selectedCourse] || 0 : 0;
  const currentQuestionCount = selectedCourse ? availableQuestions[selectedCourse] || 0 : 0;

  const handleStartExam = () => {
    if (!selectedCourse) return;
    
    const config: ExamConfiguration = {
      course: selectedCourse,
      timeLimit: timeLimit[0],
      questionCount: questionCount[0]
    };
    
    onStartExam(config);
    setIsOpen(false);
  };

  const handleCourseChange = (course: string) => {
    setSelectedCourse(course);
    const maxAvailable = Math.min(availableQuestions[course] || 0, 70);
    if (questionCount[0] > maxAvailable) {
      setQuestionCount([Math.max(5, maxAvailable)]);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedCourse || !onGenerateQuestions) return;
    
    if (materialCount === 0) {
      toast.error('No materials found for this course. Upload some materials first.');
      return;
    }

    setGeneratingForCourse(selectedCourse);
    try {
      await onGenerateQuestions(selectedCourse);
      toast.success(`Generated new questions for ${selectedCourse}!`);
    } catch (error) {
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setGeneratingForCourse('');
    }
  };

  const canGenerateQuestions = selectedCourse && materialCount > 0 && onGenerateQuestions;
  const isGeneratingForThisCourse = generatingForCourse === selectedCourse;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-wrlds-dark to-gray-800 hover:from-gray-800 hover:to-black font-space">
          <Settings className="w-4 h-4 mr-2" />
          Configure CBT Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-space text-wrlds-dark">Configure Your CBT Exam</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label className="font-space text-wrlds-dark">Select Course</Label>
            <Select value={selectedCourse} onValueChange={handleCourseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>
                    <div className="flex justify-between items-center w-full">
                      <span>{course}</span>
                      <span className="text-sm text-wrlds-accent ml-2">
                        {availableQuestions[course] || 0} available
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse && (
            <>
              {/* Course Info & Generate Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-wrlds-light/30 rounded-lg border border-wrlds-accent/20">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-wrlds-dark font-space">
                      {currentQuestionCount} questions available
                    </p>
                    <p className="text-xs text-wrlds-accent font-space">
                      {materialCount} study materials • Can generate ~25-30 new questions
                    </p>
                  </div>
                  {canGenerateQuestions && (
                    <Button
                      onClick={handleGenerateQuestions}
                      disabled={isGeneratingForThisCourse || isGenerating}
                      size="sm"
                      className="ml-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 font-space"
                    >
                      {isGeneratingForThisCourse ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {materialCount === 0 && (
                  <div className="flex items-center p-2 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-xs font-space">Upload materials to generate questions</span>
                  </div>
                )}

                {currentQuestionCount > 0 && (
                  <div className="flex items-center p-2 text-green-600 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span className="text-xs font-space">
                      Ready for CBT practice with {currentQuestionCount} questions
                    </span>
                  </div>
                )}
              </div>

              {/* Time Limit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-space text-wrlds-dark flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Time Limit
                  </Label>
                  <span className="text-sm font-semibold text-wrlds-dark font-space">
                    {timeLimit[0]} minutes
                  </span>
                </div>
                <Slider
                  value={timeLimit}
                  onValueChange={setTimeLimit}
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-wrlds-accent font-space">
                  <span>5 min</span>
                  <span>120 min</span>
                </div>
              </div>

              {/* Question Count */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-space text-wrlds-dark flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Questions
                  </Label>
                  <span className="text-sm font-semibold text-wrlds-dark font-space">
                    {questionCount[0]} / {maxQuestions} available
                  </span>
                </div>
                <Slider
                  value={questionCount}
                  onValueChange={setQuestionCount}
                  min={5}
                  max={maxQuestions}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-wrlds-accent font-space">
                  <span>5 questions</span>
                  <span>{maxQuestions} questions</span>
                </div>
              </div>

              {/* Exam Preview */}
              <Card className="bg-wrlds-light/50 border-wrlds-accent/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-wrlds-dark mb-2 font-space">Exam Preview</h4>
                  <div className="space-y-1 text-sm text-wrlds-accent font-space">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{timeLimit[0]} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Questions:</span>
                      <span>{questionCount[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time per question:</span>
                      <span>~{estimatedMinPerQuestion.toFixed(1)} min</span>
                    </div>
                  </div>
                  {estimatedMinPerQuestion < 1 && (
                    <div className="flex items-center mt-2 text-amber-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs font-space">Fast pace - less than 1 min per question</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Start Button */}
              <Button
                onClick={handleStartExam}
                disabled={!selectedCourse || isGenerating || isGeneratingForThisCourse || maxQuestions === 0}
                className="w-full bg-gradient-to-r from-wrlds-dark to-gray-800 hover:from-gray-800 hover:to-black font-space"
              >
                {isGenerating || isGeneratingForThisCourse ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Preparing Questions...
                  </>
                ) : maxQuestions === 0 ? (
                  'No Questions Available'
                ) : (
                  'Start CBT Exam'
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

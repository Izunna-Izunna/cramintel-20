
import React, { useState } from 'react';
import { Clock, Target, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CBTConfigurationDialogProps {
  courses: string[];
  availableQuestions: Record<string, number>;
  onStartExam: (config: ExamConfiguration) => void;
  isGenerating: boolean;
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
  isGenerating 
}: CBTConfigurationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState([25]); // Default 25 minutes
  const [questionCount, setQuestionCount] = useState([20]); // Default 20 questions

  const maxQuestions = selectedCourse ? Math.min(availableQuestions[selectedCourse] || 0, 70) : 70;
  const estimatedMinPerQuestion = timeLimit[0] / questionCount[0];

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
                        {availableQuestions[course] || 0} questions
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse && (
            <>
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
                disabled={!selectedCourse || isGenerating}
                className="w-full bg-gradient-to-r from-wrlds-dark to-gray-800 hover:from-gray-800 hover:to-black font-space"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Preparing Questions...
                  </>
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

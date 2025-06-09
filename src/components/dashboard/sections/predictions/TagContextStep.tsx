
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, BookOpen, ChevronRight, X } from 'lucide-react';

interface ExamContext {
  examType: string;
  timeframe: string;
  difficulty: string;
  course: string;
  examDate: string;
}

interface TagContextStepProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  examContext: ExamContext;
  onExamContextChange: (context: ExamContext) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TagContextStep({ 
  selectedTags, 
  onTagsChange, 
  examContext, 
  onExamContextChange, 
  onNext, 
  onBack 
}: TagContextStepProps) {
  const availableTags = [
    'Thermodynamics', 'Quantum Physics', 'Calculus', 'Linear Algebra',
    'Organic Chemistry', 'Data Structures', 'Machine Learning', 'Statistics',
    'Biology', 'Economics', 'History', 'Literature'
  ];

  const examTypes = [
    'Midterm Exam',
    'Final Exam',
    'Quiz',
    'Assignment',
    'Project Defense'
  ];

  const timeframes = [
    '1 week',
    '2 weeks',
    '1 month',
    '2 months',
    '3 months'
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  const handleContextChange = (field: keyof ExamContext, value: string) => {
    onExamContextChange({
      ...examContext,
      [field]: value
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-semibold mb-2">Tag Context & Exam Details</h3>
        <p className="text-gray-600">Help us understand what you're studying for.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tags Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Study Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Select relevant topics:</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedTags.includes(tag) 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exam Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Exam Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="examType">Exam Type</Label>
              <Select 
                value={examContext.examType} 
                onValueChange={(value) => handleContextChange('examType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeframe">Time Until Exam</Label>
              <Select 
                value={examContext.timeframe} 
                onValueChange={(value) => handleContextChange('timeframe', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Expected Difficulty</Label>
              <Select 
                value={examContext.difficulty} 
                onValueChange={(value) => handleContextChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(diff => (
                    <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                value={examContext.course}
                onChange={(e) => handleContextChange('course', e.target.value)}
                placeholder="e.g., Physics 101"
              />
            </div>

            <div>
              <Label htmlFor="examDate">Exam Date (optional)</Label>
              <Input
                id="examDate"
                type="date"
                value={examContext.examDate}
                onChange={(e) => handleContextChange('examDate', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={selectedTags.length === 0 || !examContext.examType || !examContext.timeframe}
          className="flex items-center gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

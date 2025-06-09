
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ExamContext {
  examType: string;
  timeframe: string;
  difficulty: string;
  course: string;
  examDate: string;
}

interface TagContextStepProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  examContext: ExamContext;
  onExamContextChange: (context: ExamContext) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TagContextStep({ 
  tags, 
  onTagsChange, 
  examContext, 
  onExamContextChange, 
  onNext, 
  onBack 
}: TagContextStepProps) {
  const [newTag, setNewTag] = React.useState('');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleContextChange = (field: keyof ExamContext, value: string) => {
    onExamContextChange({
      ...examContext,
      [field]: value
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Tag Content & Set Exam Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="tags">Add Tags</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="tags"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter a tag"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} variant="outline">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="examType">Exam Type</Label>
            <Select value={examContext.examType} onValueChange={(value) => handleContextChange('examType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="midterm">Midterm</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select value={examContext.timeframe} onValueChange={(value) => handleContextChange('timeframe', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-week">1 Week</SelectItem>
                <SelectItem value="2-weeks">2 Weeks</SelectItem>
                <SelectItem value="1-month">1 Month</SelectItem>
                <SelectItem value="immediate">Immediate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={examContext.difficulty} onValueChange={(value) => handleContextChange('difficulty', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="course">Course</Label>
            <Input
              id="course"
              value={examContext.course}
              onChange={(e) => handleContextChange('course', e.target.value)}
              placeholder="Enter course name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="examDate">Exam Date</Label>
          <Input
            id="examDate"
            type="date"
            value={examContext.examDate}
            onChange={(e) => handleContextChange('examDate', e.target.value)}
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext}>Next: Select Style</Button>
        </div>
      </CardContent>
    </Card>
  );
}


import React, { useState } from 'react';
import { Search, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagChip } from '@/components/dashboard/TagChip';

interface Context {
  course: string;
  topics: string[];
  lecturer?: string;
}

interface TagContextStepProps {
  context: Context;
  onContextChange: (context: Context) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TagContextStep({ context, onContextChange, onNext, onBack }: TagContextStepProps) {
  const [newTopic, setNewTopic] = useState('');

  const courses = [
    'ENG301 - Thermodynamics',
    'CSC204 - Data Structures',
    'PHY101 - Classical Mechanics',
    'MTH201 - Calculus II'
  ];

  const suggestedTopics = [
    'Gas Laws', 'Efficiency', 'Binary Mixtures', 'Thermo Laws',
    'Heat Transfer', 'Phase Diagrams', 'Energy Balance'
  ];

  const lecturers = [
    'Dr. Smith', 'Prof. Johnson', 'Dr. Williams', 'Prof. Brown'
  ];

  const addTopic = (topic: string) => {
    if (topic && !context.topics.includes(topic)) {
      onContextChange({
        ...context,
        topics: [...context.topics, topic]
      });
    }
    setNewTopic('');
  };

  const removeTopic = (topicToRemove: string) => {
    onContextChange({
      ...context,
      topics: context.topics.filter(topic => topic !== topicToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTopic.trim()) {
      addTopic(newTopic.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Tag & Confirm Context</h3>
        <p className="text-gray-600">Help our AI understand the scope and style of your exam</p>
      </div>

      <div className="space-y-6">
        {/* Course Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Course *
          </Label>
          <Select value={context.course} onValueChange={(value) => onContextChange({ ...context, course: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select your course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Topics */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Topics
          </Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a topic (e.g., Gas Laws, Efficiency)"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button 
                onClick={() => addTopic(newTopic.trim())} 
                disabled={!newTopic.trim()}
                variant="outline"
              >
                Add
              </Button>
            </div>
            
            {/* Suggested Topics */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Suggested topics:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((topic) => (
                  <TagChip
                    key={topic}
                    label={topic}
                    color="purple"
                    onClick={() => addTopic(topic)}
                  />
                ))}
              </div>
            </div>

            {/* Selected Topics */}
            {context.topics.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Selected topics:</p>
                <div className="flex flex-wrap gap-2">
                  {context.topics.map((topic) => (
                    <TagChip
                      key={topic}
                      label={topic}
                      color="blue"
                      removable
                      onRemove={() => removeTopic(topic)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lecturer (Optional) */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Lecturer (Optional)
          </Label>
          <Select value={context.lecturer || ''} onValueChange={(value) => onContextChange({ ...context, lecturer: value || undefined })}>
            <SelectTrigger>
              <SelectValue placeholder="Select lecturer for behavioral modeling" />
            </SelectTrigger>
            <SelectContent>
              {lecturers.map((lecturer) => (
                <SelectItem key={lecturer} value={lecturer}>
                  {lecturer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            This helps us match the tone and style of questions your lecturer typically asks
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button 
          onClick={onNext} 
          disabled={!context.course}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Continue to Style
        </Button>
      </div>
    </div>
  );
}

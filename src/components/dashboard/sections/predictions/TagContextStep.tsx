
import React, { useState, useMemo } from 'react';
import { Search, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagChip } from '@/components/dashboard/TagChip';
import { useUserProfile } from '@/hooks/useUserProfile';

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

// Course-specific topic suggestions
const getTopicSuggestions = (courseName: string): string[] => {
  const courseNameLower = courseName.toLowerCase();
  
  // Computer Science related topics
  if (courseNameLower.includes('computer') || courseNameLower.includes('csc') || 
      courseNameLower.includes('programming') || courseNameLower.includes('software')) {
    return ['Data Structures', 'Algorithms', 'Object-Oriented Programming', 'Database Design', 'Software Engineering', 'Computer Networks', 'Operating Systems'];
  }
  
  // Mathematics related topics
  if (courseNameLower.includes('math') || courseNameLower.includes('mth') || 
      courseNameLower.includes('calculus') || courseNameLower.includes('algebra')) {
    return ['Calculus', 'Linear Algebra', 'Statistics', 'Probability', 'Differential Equations', 'Discrete Mathematics', 'Mathematical Analysis'];
  }
  
  // Engineering related topics
  if (courseNameLower.includes('eng') || courseNameLower.includes('engineering') || 
      courseNameLower.includes('thermodynamics') || courseNameLower.includes('mechanics')) {
    return ['Thermodynamics', 'Heat Transfer', 'Fluid Mechanics', 'Materials Science', 'Circuit Analysis', 'Structural Analysis', 'Control Systems'];
  }
  
  // Physics related topics
  if (courseNameLower.includes('phy') || courseNameLower.includes('physics')) {
    return ['Classical Mechanics', 'Quantum Physics', 'Electromagnetism', 'Thermodynamics', 'Optics', 'Nuclear Physics', 'Relativity'];
  }
  
  // Chemistry related topics
  if (courseNameLower.includes('chem') || courseNameLower.includes('chemistry')) {
    return ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry', 'Biochemistry', 'Chemical Kinetics', 'Thermochemistry'];
  }
  
  // Biology related topics
  if (courseNameLower.includes('bio') || courseNameLower.includes('biology')) {
    return ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Molecular Biology', 'Physiology', 'Biochemistry'];
  }
  
  // Business related topics
  if (courseNameLower.includes('business') || courseNameLower.includes('management') || 
      courseNameLower.includes('economics') || courseNameLower.includes('finance')) {
    return ['Financial Management', 'Marketing Strategy', 'Operations Management', 'Human Resources', 'Business Ethics', 'Entrepreneurship', 'Market Analysis'];
  }
  
  // Default general academic topics
  return ['Problem Solving', 'Critical Analysis', 'Research Methods', 'Case Studies', 'Theory Application', 'Practical Examples'];
};

export function TagContextStep({ context, onContextChange, onNext, onBack }: TagContextStepProps) {
  const [newTopic, setNewTopic] = useState('');
  const { profile } = useUserProfile();

  // Get user's courses or provide fallback
  const userCourses = useMemo(() => {
    if (profile?.courses && profile.courses.length > 0) {
      return profile.courses;
    }
    // Fallback courses if user hasn't added any
    return [
      'Add your courses in profile settings',
      'CSC 201 - Data Structures',
      'MTH 101 - Calculus I',
      'PHY 101 - General Physics'
    ];
  }, [profile?.courses]);

  // Get user's lecturers or provide fallback
  const userLecturers = useMemo(() => {
    if (profile?.lecturers && profile.lecturers.length > 0) {
      return profile.lecturers.map(lecturer => lecturer.name);
    }
    // Fallback if user hasn't added lecturers
    return ['Add lecturers in profile settings'];
  }, [profile?.lecturers]);

  // Get course-specific topic suggestions
  const suggestedTopics = useMemo(() => {
    if (context.course && context.course !== 'Add your courses in profile settings') {
      return getTopicSuggestions(context.course);
    }
    return ['Add a course first to see relevant topic suggestions'];
  }, [context.course]);

  const addTopic = (topic: string) => {
    if (topic && !context.topics.includes(topic) && topic !== 'Add a course first to see relevant topic suggestions') {
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

  const isProfileIncomplete = !profile?.courses?.length || !profile?.lecturers?.length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Tag & Confirm Context</h3>
        <p className="text-gray-600">Help our AI understand the scope and style of your exam</p>
        {isProfileIncomplete && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 Complete your profile to see your courses and lecturers here
            </p>
          </div>
        )}
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
              {userCourses.map((course, index) => (
                <SelectItem 
                  key={`${course}-${index}`} 
                  value={course}
                  disabled={course.includes('Add your courses')}
                >
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!profile?.courses?.length && (
            <p className="text-xs text-gray-500 mt-1">
              Add your courses in your profile to see them here
            </p>
          )}
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
                placeholder="Add a topic (e.g., Algorithms, Calculus)"
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
              <p className="text-xs text-gray-500 mb-2">
                {context.course && !context.course.includes('Add your courses') 
                  ? `Suggested topics for ${context.course.split(' - ')[0]}:` 
                  : 'Suggested topics:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((topic) => (
                  <TagChip
                    key={topic}
                    label={topic}
                    color="purple"
                    onClick={() => addTopic(topic)}
                    disabled={topic.includes('Add a course first')}
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
              {userLecturers.map((lecturer, index) => (
                <SelectItem 
                  key={`${lecturer}-${index}`} 
                  value={lecturer}
                  disabled={lecturer.includes('Add lecturers')}
                >
                  {lecturer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            This helps us match the tone and style of questions your lecturer typically asks
          </p>
          {!profile?.lecturers?.length && (
            <p className="text-xs text-gray-500 mt-1">
              Add your lecturers in your profile to see them here
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button 
          onClick={onNext} 
          disabled={!context.course || context.course.includes('Add your courses')}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Continue to Style
        </Button>
      </div>
    </div>
  );
}

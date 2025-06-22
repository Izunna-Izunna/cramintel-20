
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X, Target, MessageCircle, BookOpen, Users } from 'lucide-react';
import { PredictionContext } from '@/types/predictions';

interface ContextualIntelligenceStepProps {
  context: PredictionContext;
  onContextChange: (context: PredictionContext) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ContextualIntelligenceStep({
  context,
  onContextChange,
  onNext,
  onBack
}: ContextualIntelligenceStepProps) {
  const [newTopic, setNewTopic] = useState('');

  const handleInputChange = (field: keyof PredictionContext, value: string) => {
    onContextChange({
      ...context,
      [field]: value
    });
  };

  const addTopicEmphasis = () => {
    if (newTopic.trim()) {
      const currentTopics = context.topic_emphasis || [];
      onContextChange({
        ...context,
        topic_emphasis: [...currentTopics, newTopic.trim()]
      });
      setNewTopic('');
    }
  };

  const removeTopicEmphasis = (index: number) => {
    const currentTopics = context.topic_emphasis || [];
    onContextChange({
      ...context,
      topic_emphasis: currentTopics.filter((_, i) => i !== index)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTopicEmphasis();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Contextual Intelligence</h3>
        <p className="text-gray-600">Share insider knowledge to improve prediction accuracy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lecturer Behavior */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Lecturer Behavior</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Did your lecturer repeatedly emphasize any topics?
              </Label>
              <Textarea
                placeholder="e.g., 'The professor kept saying thermodynamics is very important for the exam...'"
                value={context.lecturer_emphasis || ''}
                onChange={(e) => handleInputChange('lecturer_emphasis', e.target.value)}
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                What topics got the most class time?
              </Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add topic..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addTopicEmphasis}
                    disabled={!newTopic.trim()}
                  >
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(context.topic_emphasis || []).map((topic, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {topic}
                      <button
                        onClick={() => removeTopicEmphasis(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Patterns */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Assignment Patterns</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Were any specific assignment topics heavily weighted?
              </Label>
              <Textarea
                placeholder="e.g., '60% of assignments focused on data structures, especially trees and graphs...'"
                value={context.assignment_patterns || ''}
                onChange={(e) => handleInputChange('assignment_patterns', e.target.value)}
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Did assignments focus on calculations, theory, or both?
              </Label>
              <RadioGroup
                value={context.assignment_focus || ''}
                onValueChange={(value) => handleInputChange('assignment_focus', value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="calculations" id="calculations" />
                  <Label htmlFor="calculations">Mostly Calculations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="theory" id="theory" />
                  <Label htmlFor="theory">Mostly Theory</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Mix of Both</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Class Intelligence */}
        <Card className="border-2 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">Class Intelligence</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Any rumors or gists about likely questions?
              </Label>
              <Textarea
                placeholder="e.g., 'Someone heard from a senior that the professor always asks about sorting algorithms...'"
                value={context.class_rumors || ''}
                onChange={(e) => handleInputChange('class_rumors', e.target.value)}
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Any revision hints or last-minute tips shared?
              </Label>
              <Textarea
                placeholder="e.g., 'TA mentioned during tutorial that we should focus on Chapter 5 problems...'"
                value={context.revision_hints || ''}
                onChange={(e) => handleInputChange('revision_hints', e.target.value)}
                className="mt-1 min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          className="bg-gray-800 hover:bg-gray-900 text-white"
        >
          Continue to Style Selection
        </Button>
      </div>
    </div>
  );
}

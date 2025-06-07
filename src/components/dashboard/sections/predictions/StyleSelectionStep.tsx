
import React from 'react';
import { Zap, FileText, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface StyleSelectionStepProps {
  selectedStyle: 'bullet' | 'theory' | 'mixed';
  onStyleChange: (style: 'bullet' | 'theory' | 'mixed') => void;
  onNext: () => void;
  onBack: () => void;
}

export function StyleSelectionStep({ selectedStyle, onStyleChange, onNext, onBack }: StyleSelectionStepProps) {
  const styles = [
    {
      id: 'bullet' as const,
      icon: Zap,
      title: 'Bullet-style predictions',
      description: 'What\'s most likely — clean and fast',
      example: '• Define the Zeroth Law of Thermodynamics\n• Calculate efficiency of Carnot cycle\n• Explain ideal gas assumptions',
      color: 'blue'
    },
    {
      id: 'theory' as const,
      icon: FileText,
      title: 'Theory-style predictions',
      description: 'As your lecturer might write it',
      example: 'Question 1: Discuss the fundamental principles of thermodynamics, with particular emphasis on the relationship between heat, work, and internal energy. Provide relevant examples.',
      color: 'green'
    },
    {
      id: 'mixed' as const,
      icon: Target,
      title: 'Mixed with confidence scores',
      description: 'Smart summary with bold guesses + rationale',
      example: '🔮 95% confident: "Define entropy" (appears in 4/5 past papers)\n📌 78% confident: "Binary mixture problems" (matches assignment pattern)',
      color: 'purple'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Choose Your Prediction Style</h3>
        <p className="text-gray-600">How would you like your predictions delivered?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {styles.map((style) => (
          <Card
            key={style.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedStyle === style.id
                ? 'ring-2 ring-purple-500 border-purple-200 shadow-lg'
                : 'hover:shadow-md border-gray-200'
            }`}
            onClick={() => onStyleChange(style.id)}
          >
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                  style.color === 'blue' ? 'bg-blue-100' :
                  style.color === 'green' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  <style.icon className={`w-6 h-6 ${
                    style.color === 'blue' ? 'text-blue-600' :
                    style.color === 'green' ? 'text-green-600' : 'text-purple-600'
                  }`} />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">{style.title}</h4>
                <p className="text-sm text-gray-600">{style.description}</p>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2">Example output:</p>
                <div className="bg-gray-50 rounded p-3 text-xs text-gray-700 whitespace-pre-line">
                  {style.example}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} className="bg-purple-600 hover:bg-purple-700">
          Generate Predictions
        </Button>
      </div>
    </div>
  );
}

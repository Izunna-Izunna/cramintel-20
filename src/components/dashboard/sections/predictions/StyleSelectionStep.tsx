
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type StyleType = 'bullet' | 'theory' | 'mixed' | 'exam-paper';

interface StyleSelectionStepProps {
  selectedStyle: StyleType;
  onStyleChange: (style: StyleType) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StyleSelectionStep({ 
  selectedStyle, 
  onStyleChange, 
  onNext, 
  onBack 
}: StyleSelectionStepProps) {
  const styles = [
    {
      id: 'bullet' as StyleType,
      name: 'Bullet Points',
      description: 'Concise, organized bullet point format',
      icon: '•'
    },
    {
      id: 'theory' as StyleType,
      name: 'Theory Focus',
      description: 'Detailed theoretical explanations',
      icon: '📚'
    },
    {
      id: 'mixed' as StyleType,
      name: 'Mixed Format',
      description: 'Combination of theory and practice',
      icon: '🔄'
    },
    {
      id: 'exam-paper' as StyleType,
      name: 'Exam Paper Style',
      description: 'Formatted like an actual exam',
      icon: '📝'
    }
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Prediction Style</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {styles.map((style) => (
            <div
              key={style.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedStyle === style.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onStyleChange(style.id)}
            >
              <div className="text-2xl mb-2">{style.icon}</div>
              <h3 className="font-semibold">{style.name}</h3>
              <p className="text-sm text-gray-600">{style.description}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext} disabled={!selectedStyle}>
            Generate Prediction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, FileText, Target, CheckCircle } from 'lucide-react';

interface EnhancedStyleSelectionStepProps {
  selectedStyle: 'ranked' | 'practice_exam' | 'topic_based' | 'bullet' | 'theory' | 'mixed' | 'exam-paper';
  onStyleChange: (style: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const enhancedStyles = [
  {
    id: 'ranked',
    name: 'Ranked Predictions',
    icon: TrendingUp,
    badge: 'Recommended',
    badgeColor: 'bg-green-100 text-green-800',
    description: 'Questions ranked by confidence level with clear rationales',
    features: [
      'High/Medium/Low confidence grouping',
      'Clear rationale for each prediction',
      'Study priority guidance',
      'Source references from your materials'
    ],
    confidence: 'High accuracy based on material analysis'
  },
  {
    id: 'practice_exam',
    name: 'Full Practice Exam',
    icon: FileText,
    badge: 'Comprehensive',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: 'Complete exam paper format with timing and marking guidance',
    features: [
      'Realistic exam paper layout',
      'Time allocation suggestions',
      'Marking scheme insights',
      'Question difficulty indicators'
    ],
    confidence: 'Structured like actual exam papers'
  },
  {
    id: 'topic_based',
    name: 'Topic-Based Analysis',
    icon: Target,
    badge: 'Organized',
    badgeColor: 'bg-purple-100 text-purple-800',
    description: 'Predictions organized by course topics with emphasis levels',
    features: [
      'Grouped by course topics',
      'Cross-references with materials',
      'Topic emphasis indicators',
      'Comprehensive coverage check'
    ],
    confidence: 'Systematic topic coverage'
  }
] as const;

export function EnhancedStyleSelectionStep({
  selectedStyle,
  onStyleChange,
  onNext,
  onBack
}: EnhancedStyleSelectionStepProps) {
  // Convert legacy styles to new format
  const normalizeStyleId = (style: string) => {
    switch (style) {
      case 'bullet':
      case 'theory':
      case 'mixed':
        return 'ranked';
      case 'exam-paper':
        return 'practice_exam';
      default:
        return style;
    }
  };

  const currentStyle = normalizeStyleId(selectedStyle);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Choose Prediction Style</h3>
        <p className="text-gray-600">Select how you want your exam predictions presented</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {enhancedStyles.map((style) => {
          const Icon = style.icon;
          const isSelected = currentStyle === style.id;
          
          return (
            <Card
              key={style.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-gray-800 border-gray-800' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onStyleChange(style.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{style.name}</CardTitle>
                      <Badge className={`text-xs ${style.badgeColor} mt-1`}>
                        {style.badge}
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  {style.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  {style.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className={`text-xs px-3 py-2 rounded-lg ${
                  isSelected ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  🎯 {style.confidence}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currentStyle && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {enhancedStyles.find(s => s.id === currentStyle)?.name} selected - 
                This style will provide {enhancedStyles.find(s => s.id === currentStyle)?.confidence.toLowerCase()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          className="bg-gray-800 hover:bg-gray-900 text-white"
        >
          Generate Predictions
        </Button>
      </div>
    </div>
  );
}

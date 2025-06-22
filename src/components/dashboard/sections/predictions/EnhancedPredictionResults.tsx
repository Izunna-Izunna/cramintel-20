
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Target,
  BookOpen,
  Star,
  AlertCircle
} from 'lucide-react';
import { GeneratedQuestion, PredictionResponse } from '@/types/predictions';

interface EnhancedPredictionResultsProps {
  predictionData: any;
  onBack: () => void;
  onClose: () => void;
}

interface GroupedPredictions {
  high: GeneratedQuestion[];
  medium: GeneratedQuestion[];
  low: GeneratedQuestion[];
}

export function EnhancedPredictionResults({
  predictionData,
  onBack,
  onClose
}: EnhancedPredictionResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [showStudyGuide, setShowStudyGuide] = useState(false);

  const toggleQuestionExpansion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  // Group predictions by confidence level
  const groupPredictionsByConfidence = (predictions: GeneratedQuestion[]): GroupedPredictions => {
    return predictions.reduce(
      (groups, prediction) => {
        const confidence = prediction.confidence || 0;
        if (confidence >= 85) {
          groups.high.push(prediction);
        } else if (confidence >= 60) {
          groups.medium.push(prediction);
        } else {
          groups.low.push(prediction);
        }
        return groups;
      },
      { high: [], medium: [], low: [] } as GroupedPredictions
    );
  };

  const predictions = predictionData.generatedContent?.predictions || [];
  const groupedPredictions = groupPredictionsByConfidence(predictions);
  const studyGuide = predictionData.generatedContent?.study_guide;

  const getConfidenceIcon = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'medium':
        return <Minus className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const getConfidenceBadge = (level: 'high' | 'medium' | 'low', count: number) => {
    const configs = {
      high: { bg: 'bg-green-100', text: 'text-green-800', label: 'HIGH CONFIDENCE (85-95%)' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'MEDIUM CONFIDENCE (60-84%)' },
      low: { bg: 'bg-red-100', text: 'text-red-800', label: 'LOW CONFIDENCE (40-59%)' }
    };
    
    const config = configs[level];
    return (
      <Badge className={`${config.bg} ${config.text} text-xs font-medium`}>
        {config.label} • {count} Questions
      </Badge>
    );
  };

  const renderPredictionGroup = (
    level: 'high' | 'medium' | 'low', 
    predictions: GeneratedQuestion[]
  ) => {
    if (predictions.length === 0) return null;

    return (
      <Card key={level} className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConfidenceIcon(level)}
              {getConfidenceBadge(level, predictions.length)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-800 flex-1 pr-4">
                    {index + 1}. {prediction.question}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {prediction.confidence}%
                  </Badge>
                </div>
                
                {prediction.rationale && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleQuestionExpansion(index)}
                        className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        📍 Why this question?
                        {expandedQuestions.has(index) ? 
                          <ChevronUp className="w-3 h-3 ml-1" /> : 
                          <ChevronDown className="w-3 h-3 ml-1" />
                        }
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {expandedQuestions.has(index) && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md border-l-4 border-blue-200">
                          <div className="space-y-2">
                            {Array.isArray(prediction.rationale) ? 
                              prediction.rationale.map((reason, rIndex) => (
                                <div key={rIndex} className="flex items-start gap-2 text-sm text-blue-800">
                                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{reason}</span>
                                </div>
                              )) :
                              <p className="text-sm text-blue-800">{prediction.rationale}</p>
                            }
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {prediction.sources && prediction.sources.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      Sources: {prediction.sources.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">🎯 Your Exam Predictions</h3>
        <p className="text-gray-600">AI-powered predictions with confidence levels and rationales</p>
      </div>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{groupedPredictions.high.length}</div>
              <div className="text-sm text-gray-600">High Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{groupedPredictions.medium.length}</div>
              <div className="text-sm text-gray-600">Medium Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{groupedPredictions.low.length}</div>
              <div className="text-sm text-gray-600">Low Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{predictions.length}</div>
              <div className="text-sm text-gray-600">Total Predictions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Groups */}
      <div className="space-y-6">
        {renderPredictionGroup('high', groupedPredictions.high)}
        {renderPredictionGroup('medium', groupedPredictions.medium)}
        {renderPredictionGroup('low', groupedPredictions.low)}
      </div>

      {/* Study Focus Guide */}
      {studyGuide && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg text-purple-800">Study Focus Guide</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStudyGuide(!showStudyGuide)}
              >
                {showStudyGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <Collapsible open={showStudyGuide} onOpenChange={setShowStudyGuide}>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-800">Priority 1 (60%)</span>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {studyGuide.priority_1?.map((topic: string, index: number) => (
                        <li key={index}>• {topic}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-yellow-800">Priority 2 (30%)</span>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {studyGuide.priority_2?.map((topic: string, index: number) => (
                        <li key={index}>• {topic}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-800">Priority 3 (10%)</span>
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {studyGuide.priority_3?.map((topic: string, index: number) => (
                        <li key={index}>• {topic}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Generation
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => window.print()}>
            Print Predictions
          </Button>
          <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-900 text-white">
            Save & Close
          </Button>
        </div>
      </div>
    </div>
  );
}

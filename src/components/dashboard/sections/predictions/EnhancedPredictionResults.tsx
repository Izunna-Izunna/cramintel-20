
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Copy, Share, BookOpen, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GeneratedQuestion, PredictionStyle } from '@/types/predictions';

interface PredictionData {
  clues: Array<{
    id: string;
    name: string;
    type: 'past-questions' | 'assignment' | 'whisper';
    content?: string;
    materialId?: string;
  }>;
  context: {
    course: string;
    topics: string[];
    lecturer?: string;
  };
  style: PredictionStyle;
  generatedContent?: {
    predictions?: GeneratedQuestion[];
    overall_confidence?: number;
    analysis_summary?: string;
    study_guide?: {
      priority_1: string[];
      priority_2: string[];
      priority_3: string[];
    };
  };
}

interface EnhancedPredictionResultsProps {
  predictionData: PredictionData;
  onBack: () => void;
  onClose: () => void;
}

export function EnhancedPredictionResults({ predictionData, onBack, onClose }: EnhancedPredictionResultsProps) {
  const [activeTab, setActiveTab] = useState('predictions');
  const { toast } = useToast();

  const predictions = predictionData.generatedContent?.predictions || [];
  const confidence = predictionData.generatedContent?.overall_confidence || 0;
  const analysisData = predictionData.generatedContent?.analysis_summary;
  const studyGuide = predictionData.generatedContent?.study_guide;

  const exportPredictions = () => {
    const content = predictions.map((p, index) => {
      let questionText = `Question ${index + 1}: ${p.question}`;
      if (p.confidence) {
        questionText += `\nConfidence: ${Math.round(p.confidence)}%`;
      }
      if (p.reasoning) {
        questionText += `\nReasoning: ${p.reasoning}`;
      }
      if (p.sources && p.sources.length > 0) {
        questionText += `\nSources: ${p.sources.join(', ')}`;
      }
      return questionText;
    }).join('\n\n' + '-'.repeat(50) + '\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${predictionData.context.course}_Predictions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Predictions exported",
      description: "Your predictions have been downloaded as a text file.",
    });
  };

  const copyToClipboard = () => {
    const content = predictions.map(p => p.question).join('\n\n');
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "All predictions have been copied to your clipboard.",
    });
  };

  const getStyleName = (style: PredictionStyle) => {
    const styleNames = {
      'bullet': 'Quick Predictions',
      'theory': 'Theory Questions',
      'mixed': 'Mixed Format',
      'exam-paper': 'Exam Paper',
      'ranked': 'Ranked Predictions',
      'practice_exam': 'Practice Exam',
      'topic_based': 'Topic-Based',
      'objective_bulk': 'Objective Questions'
    };
    return styleNames[style] || 'Predictions';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const renderPredictions = () => (
    <div className="space-y-4">
      {predictions.map((prediction, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-800 text-lg">
                  Question {index + 1}
                </h3>
                <div className="flex gap-2">
                  {prediction.confidence && (
                    <Badge
                      variant="outline"
                      className={getConfidenceColor(prediction.confidence)}
                    >
                      {Math.round(prediction.confidence)}% likely
                    </Badge>
                  )}
                  {prediction.difficulty && (
                    <Badge variant={
                      prediction.difficulty === 'easy' ? 'default' :
                      prediction.difficulty === 'medium' ? 'secondary' : 'destructive'
                    }>
                      {prediction.difficulty}
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">
                {prediction.question}
              </p>

              {prediction.reasoning && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">Why this might appear:</p>
                  <p className="text-blue-700 text-sm">{prediction.reasoning}</p>
                </div>
              )}

              {prediction.sources && prediction.sources.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Based on:</p>
                  <div className="flex flex-wrap gap-1">
                    {prediction.sources.map((source, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {prediction.hint && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 mb-1">Study Tip:</p>
                  <p className="text-amber-700 text-sm">{prediction.hint}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Prediction Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{predictions.length}</p>
              <p className="text-sm text-gray-600">Predictions Generated</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{Math.round(confidence)}%</p>
              <p className="text-sm text-gray-600">Average Confidence</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{predictionData.clues.length}</p>
              <p className="text-sm text-gray-600">Sources Analyzed</p>
            </div>
          </div>

          {analysisData && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Analysis Summary</h4>
              <p className="text-blue-700 text-sm leading-relaxed">{analysisData}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Context Used
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-800">Course:</p>
              <p className="text-gray-600">{predictionData.context.course}</p>
            </div>
            {predictionData.context.topics.length > 0 && (
              <div>
                <p className="font-medium text-gray-800">Topics:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {predictionData.context.topics.map((topic, idx) => (
                    <Badge key={idx} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-800">Prediction Style:</p>
              <p className="text-gray-600">{getStyleName(predictionData.style)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStudyGuide = () => {
    if (!studyGuide) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Study Guide Available</h3>
            <p className="text-gray-600">
              Study recommendations were not generated for these predictions.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Lightbulb className="w-5 h-5" />
              High Priority Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Focus on these topics first - they're most likely to appear:</p>
            <div className="space-y-2">
              {studyGuide.priority_1.map((topic, index) => (
                <Badge key={index} variant="destructive" className="mr-2 mb-2">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Lightbulb className="w-5 h-5" />
              Medium Priority Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Review these topics after covering high priority ones:</p>
            <div className="space-y-2">
              {studyGuide.priority_2.map((topic, index) => (
                <Badge key={index} variant="secondary" className="mr-2 mb-2">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Lightbulb className="w-5 h-5" />
              Low Priority Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Cover these if you have extra time:</p>
            <div className="space-y-2">
              {studyGuide.priority_3.map((topic, index) => (
                <Badge key={index} variant="outline" className="mr-2 mb-2">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (predictions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Predictions Generated</h3>
          <p className="text-gray-600 mb-6">
            We couldn't generate predictions from your materials. This might be because:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-1">
            <li>• The materials don't contain enough exam-relevant content</li>
            <li>• The AI service encountered an issue</li>
            <li>• The selected style doesn't match your materials</li>
          </ul>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {getStyleName(predictionData.style)} - {predictionData.context.course}
          </h2>
          <p className="text-gray-600">
            {predictions.length} predictions generated • 
            Overall confidence: {Math.round(confidence)}%
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={exportPredictions}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="study-guide">Study Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="mt-6">
            {renderPredictions()}
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            {renderAnalysis()}
          </TabsContent>

          <TabsContent value="study-guide" className="mt-6">
            {renderStudyGuide()}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-between items-center"
      >
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Style Selection
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportPredictions}>
            <Download className="w-4 h-4 mr-2" />
            Export Predictions
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </div>
  );
}


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  BookOpen, 
  Target,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PredictionResponse } from '@/types/predictions';

interface ObjectiveQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  confidence: number;
  rationale: string[];
  sources: string[];
  confidence_level: 'high' | 'medium' | 'low';
  study_priority: number;
  type: string;
  marks: number;
  topic?: string;
}

interface ObjectiveQuestionsViewProps {
  predictionData: {
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
    style: string;
    generatedContent?: PredictionResponse;
  };
  onBack: () => void;
  onClose: () => void;
}

export function ObjectiveQuestionsView({ predictionData, onBack, onClose }: ObjectiveQuestionsViewProps) {
  const [questions, setQuestions] = useState<ObjectiveQuestion[]>(
    predictionData.generatedContent?.predictions?.filter(p => p.type === 'objective') || []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  // Get unique topics for filtering
  const uniqueTopics = Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));

  // Filter questions based on search and filters
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || question.topic === selectedTopic;
    const matchesPriority = selectedPriority === 'all' || question.study_priority.toString() === selectedPriority;
    
    return matchesSearch && matchesTopic && matchesPriority;
  });

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-predictions', {
        body: {
          clues: predictionData.clues,
          context: predictionData.context,
          style: 'objective_bulk'
        }
      });

      if (error) throw error;

      if (data?.success && data.data?.predictions) {
        const newQuestions = data.data.predictions.filter((p: any) => p.type === 'objective');
        setQuestions(newQuestions);
        toast({
          title: "Success!",
          description: `Generated ${newQuestions.length} new objective questions.`,
        });
      } else {
        throw new Error(data?.error || 'Failed to generate new questions');
      }
    } catch (error) {
      console.error('Error regenerating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate new questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const exportQuestions = () => {
    const exportData = filteredQuestions.map((q, index) => ({
      number: index + 1,
      question: q.question,
      options: q.options.join(', '),
      correct_answer: q.correct_answer,
      topic: q.topic || 'General',
      confidence: q.confidence,
      sources: q.sources.join(', ')
    }));

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${predictionData.context.course}_objective_questions.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Questions exported to CSV file.",
    });
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Objective Questions</h2>
            <p className="text-gray-600">{questions.length} questions for {predictionData.context.course}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search questions or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Topics</option>
                {uniqueTopics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="1">High Priority</option>
                <option value="2">Medium Priority</option>
                <option value="3">Low Priority</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Generating...' : 'New Set'}
              </Button>
              
              <Button onClick={exportQuestions} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredQuestions.map((question, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Q{index + 1}
                      </Badge>
                      {question.topic && (
                        <Badge variant="secondary" className="text-xs">
                          {question.topic}
                        </Badge>
                      )}
                      <Badge className={`text-xs ${getConfidenceColor(question.confidence_level)}`}>
                        {question.confidence}%
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(question.study_priority)}`}>
                        P{question.study_priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-relaxed">
                      {question.question}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Options */}
                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-2 rounded text-sm ${
                          option.charAt(0) === question.correct_answer
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>

                  {/* Rationale */}
                  {question.rationale && question.rationale.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="font-medium flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Rationale:
                      </div>
                      {question.rationale.map((reason, idx) => (
                        <div key={idx} className="pl-4">• {reason}</div>
                      ))}
                    </div>
                  )}

                  {/* Sources */}
                  {question.sources && question.sources.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <div className="font-medium flex items-center gap-1 mb-1">
                        <BookOpen className="w-3 h-3" />
                        Sources:
                      </div>
                      <div className="pl-4">{question.sources.join(', ')}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-800">{questions.length}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {questions.filter(q => q.confidence_level === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {questions.filter(q => q.study_priority === 1).length}
              </div>
              <div className="text-sm text-gray-600">Priority 1</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{uniqueTopics.length}</div>
              <div className="text-sm text-gray-600">Topics Covered</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

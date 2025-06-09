import React, { useState } from 'react';
import { Upload, FileText, MessageSquare, BookOpen, X, Check, Brain, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { TagChip } from '@/components/dashboard/TagChip';
import { useMaterials } from '@/hooks/useMaterials';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Clue {
  id: string;
  name: string;
  type: 'past-questions' | 'assignment' | 'whisper';
  content?: string;
  materialId?: string;
}

interface UploadCluesStepProps {
  clues: Clue[];
  onCluesChange: (clues: Clue[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function UploadCluesStep({ clues, onCluesChange, onNext, onBack }: UploadCluesStepProps) {
  const [whisperText, setWhisperText] = useState('');
  const [showWhisperInput, setShowWhisperInput] = useState(false);
  const [showMaterialsSelector, setShowMaterialsSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<'past-questions' | 'assignment' | null>(null);
  const { materials, loading } = useMaterials();

  const addWhisper = () => {
    if (whisperText.trim()) {
      const newClue: Clue = {
        id: Date.now().toString(),
        name: `Whisper: ${whisperText.slice(0, 30)}...`,
        type: 'whisper',
        content: whisperText
      };
      onCluesChange([...clues, newClue]);
      setWhisperText('');
      setShowWhisperInput(false);
    }
  };

  const addMaterialClue = (material: any) => {
    const newClue: Clue = {
      id: material.id,
      name: material.name,
      type: selectedType!,
      materialId: material.id
    };
    onCluesChange([...clues, newClue]);
    setShowMaterialsSelector(false);
    setSelectedType(null);
  };

  const removeClue = (id: string) => {
    onCluesChange(clues.filter(clue => clue.id !== id));
  };

  const openMaterialsSelector = (type: 'past-questions' | 'assignment') => {
    setSelectedType(type);
    setShowMaterialsSelector(true);
  };

  const getClueIcon = (type: string) => {
    switch (type) {
      case 'past-questions':
        return <FileText className="w-4 h-4" />;
      case 'assignment':
        return <BookOpen className="w-4 h-4" />;
      case 'whisper':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getClueColor = (type: string): 'blue' | 'green' | 'yellow' => {
    switch (type) {
      case 'past-questions':
        return 'blue';
      case 'assignment':
        return 'green';
      case 'whisper':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  const getFilteredMaterials = () => {
    if (!selectedType) return materials;
    
    const typeMap = {
      'past-questions': 'past-question',
      'assignment': 'assignment'
    };
    
    return materials.filter(material => 
      material.material_type === typeMap[selectedType] ||
      material.material_type === 'notes'
    );
  };

  const getAnalysisInsights = () => {
    const materialTypes = clues.map(clue => clue.type);
    const hasPastQuestions = materialTypes.includes('past-questions');
    const hasAssignments = materialTypes.includes('assignment');
    const hasWhispers = materialTypes.includes('whisper');
    const totalClues = clues.length;

    let confidenceLevel = 'Low';
    let insights = [];

    if (totalClues >= 3) {
      confidenceLevel = 'Medium';
      if (hasPastQuestions && hasAssignments) {
        confidenceLevel = 'High';
      }
    }

    if (hasPastQuestions) {
      insights.push('Past questions provide high prediction accuracy');
    }
    if (hasAssignments) {
      insights.push('Assignments often become exam questions');
    }
    if (hasWhispers) {
      insights.push('Lecturer hints add valuable context');
    }
    if (totalClues >= 4) {
      insights.push('Multiple sources increase reliability');
    }

    return { confidenceLevel, insights };
  };

  const { confidenceLevel, insights } = getAnalysisInsights();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Your Exam Clues</h3>
        <p className="text-gray-600">Add materials that help our AI predict your exam questions</p>
        
        {clues.length > 0 && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">AI Analysis Preview</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Badge variant={confidenceLevel === 'High' ? 'default' : confidenceLevel === 'Medium' ? 'secondary' : 'outline'}>
                {confidenceLevel} Confidence
              </Badge>
              <span className="text-purple-700">{clues.length} sources detected</span>
            </div>
            {insights.length > 0 && (
              <div className="mt-2 text-xs text-purple-600">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                {insights[0]}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200" onClick={() => openMaterialsSelector('past-questions')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-1">Past Questions</h4>
            <p className="text-sm text-gray-600 mb-3">Highest accuracy predictor</p>
            <div className="text-xs text-blue-600 mb-3">
              <Badge variant="outline" className="text-xs">95% accuracy</Badge>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Browse Materials
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-200" onClick={() => openMaterialsSelector('assignment')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold mb-1">Assignments</h4>
            <p className="text-sm text-gray-600 mb-3">Test scripts, coursework</p>
            <div className="text-xs text-green-600 mb-3">
              <Badge variant="outline" className="text-xs">85% accuracy</Badge>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Browse Materials
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-yellow-200" onClick={() => setShowWhisperInput(true)}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-yellow-600" />
            </div>
            <h4 className="font-semibold mb-1">Class Whispers</h4>
            <p className="text-sm text-gray-600 mb-3">Lecturer hints, rumors</p>
            <div className="text-xs text-yellow-600 mb-3">
              <Badge variant="outline" className="text-xs">Context boost</Badge>
            </div>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Whisper
            </Button>
          </CardContent>
        </Card>
      </div>

      {showMaterialsSelector && selectedType && (
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-800">
                Select {selectedType === 'past-questions' ? 'Past Questions' : 'Assignment'} Materials
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setShowMaterialsSelector(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {getFilteredMaterials().length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No materials found. Upload some materials first in the Upload section.
                  </p>
                ) : (
                  getFilteredMaterials().map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-purple-300 transition-colors">
                      <div className="flex items-center gap-3">
                        {getClueIcon(selectedType)}
                        <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-sm text-gray-500">{material.course} • {material.material_type}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => addMaterialClue(material)}
                        disabled={clues.some(clue => clue.materialId === material.id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {clues.some(clue => clue.materialId === material.id) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showWhisperInput && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-800">Add a Whisper</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowWhisperInput(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              placeholder="e.g., 'Professor said Chapter 6 is 80% likely to appear' or 'Focus on thermodynamic laws - he emphasized this 3 times'"
              value={whisperText}
              onChange={(e) => setWhisperText(e.target.value)}
              className="mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={addWhisper} size="sm" className="bg-orange-600 hover:bg-orange-700">
                Add Whisper
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowWhisperInput(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {clues.length > 0 && (
        <div className="mb-8">
          <h4 className="font-semibold text-gray-800 mb-4">
            Uploaded Clues ({clues.length})
            <Badge variant="secondary" className="ml-2">
              {confidenceLevel} Prediction Quality
            </Badge>
          </h4>
          <div className="space-y-3">
            {clues.map((clue) => (
              <div key={clue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getClueIcon(clue.type)}
                    <span className="font-medium">{clue.name}</span>
                  </div>
                  <TagChip 
                    label={clue.type.replace('-', ' ')} 
                    color={getClueColor(clue.type)}
                  />
                  {clue.type === 'past-questions' && (
                    <Badge variant="outline" className="text-xs text-blue-600">High Impact</Badge>
                  )}
                  {clue.type === 'assignment' && (
                    <Badge variant="outline" className="text-xs text-green-600">Exam Likely</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeClue(clue.id)} className="hover:bg-red-100 hover:text-red-700">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button 
          onClick={onNext} 
          disabled={clues.length === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Continue to Context Tagging
        </Button>
      </div>
    </div>
  );
}

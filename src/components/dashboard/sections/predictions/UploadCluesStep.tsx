
import React, { useState } from 'react';
import { Upload, FileText, MessageSquare, BookOpen, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { TagChip } from '@/components/dashboard/TagChip';
import { useMaterials } from '@/hooks/useMaterials';
import { Skeleton } from '@/components/ui/skeleton';

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

  const getClueColor = (type: string): 'blue' | 'green' | 'orange' => {
    switch (type) {
      case 'past-questions':
        return 'blue';
      case 'assignment':
        return 'green';
      case 'whisper':
        return 'orange';
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
      material.material_type === 'notes' // Notes can be used for any type
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Your Exam Clues</h3>
        <p className="text-gray-600">Add any materials that might help predict your exam questions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openMaterialsSelector('past-questions')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-1">Past Questions</h4>
            <p className="text-sm text-gray-600 mb-3">Select from uploaded materials</p>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Browse Materials
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openMaterialsSelector('assignment')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold mb-1">Assignments</h4>
            <p className="text-sm text-gray-600 mb-3">Test scripts, coursework</p>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Browse Materials
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowWhisperInput(true)}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-semibold mb-1">Class Whispers</h4>
            <p className="text-sm text-gray-600 mb-3">Lecturer hints, rumors</p>
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
                    <div key={material.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
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
              placeholder="e.g., 'Professor said Chapter 6 is 80% likely to appear' or 'Focus on thermodynamic laws'"
              value={whisperText}
              onChange={(e) => setWhisperText(e.target.value)}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button onClick={addWhisper} size="sm">Add Whisper</Button>
              <Button variant="outline" size="sm" onClick={() => setShowWhisperInput(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {clues.length > 0 && (
        <div className="mb-8">
          <h4 className="font-semibold text-gray-800 mb-4">Uploaded Clues ({clues.length})</h4>
          <div className="space-y-3">
            {clues.map((clue) => (
              <div key={clue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getClueIcon(clue.type)}
                    <span className="font-medium">{clue.name}</span>
                  </div>
                  <TagChip 
                    label={clue.type.replace('-', ' ')} 
                    color={getClueColor(clue.type)}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeClue(clue.id)}>
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
          Continue to Tagging
        </Button>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Filter, Wand2 } from 'lucide-react';
import { TagChip } from '../../TagChip';

interface CreateDeckFlowProps {
  onClose: () => void;
  onComplete: () => void;
}

export function CreateDeckFlow({ onClose, onComplete }: CreateDeckFlowProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedMaterialType, setSelectedMaterialType] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('qa');
  const [deckName, setDeckName] = useState('');
  const [useAllMaterials, setUseAllMaterials] = useState(false);

  const uploadedFiles = [
    { id: 'file1', name: 'Thermodynamics_Week4_Notes.pdf', course: 'PHY 101', type: 'notes', tags: ['Thermodynamics'] },
    { id: 'file2', name: 'DataStructures_Chapter3.pdf', course: 'CSC 202', type: 'notes', tags: ['Data Structures'] },
    { id: 'file3', name: 'Math_Formulas_Sheet.pdf', course: 'ENG 301', type: 'notes', tags: ['Mathematics'] },
    { id: 'file4', name: 'PHY101_PastQuestions.pdf', course: 'PHY 101', type: 'past-question', tags: ['Thermodynamics'] },
  ];

  const courseOptions = ['PHY 101', 'CSC 202', 'ENG 301', 'MTH 201', 'CHE 205'];
  const materialTypes = [
    { id: 'notes', label: '📘 Notes' },
    { id: 'past-question', label: '📝 Past Questions' },
    { id: 'assignment', label: '🧪 Assignment' },
    { id: 'whisper', label: '🤫 Whisper' }
  ];

  const formatOptions = [
    { 
      id: 'qa', 
      name: 'Q&A (Default)', 
      description: 'Traditional question and answer format',
      example: 'Q: What is Newton\'s first law? A: An object at rest...'
    },
    { 
      id: 'fill', 
      name: 'Fill-in-the-blank', 
      description: 'Complete missing parts in statements',
      example: 'Newton\'s first law states that an object at ___ will stay at ___'
    },
    { 
      id: 'definitions', 
      name: 'Definitions Only', 
      description: 'Term and definition pairs for quick lookup',
      example: 'Inertia: The tendency of an object to resist changes in motion'
    },
    { 
      id: 'mcq', 
      name: 'Multiple Choice (Coming Soon)', 
      description: 'Choose from multiple options',
      example: 'What is inertia? A) Force B) Resistance to change C) Acceleration',
      disabled: true
    }
  ];

  const filteredFiles = uploadedFiles.filter(file => {
    if (useAllMaterials) return true;
    const courseMatch = !selectedCourse || file.course === selectedCourse;
    const typeMatch = !selectedMaterialType || file.type === selectedMaterialType;
    return courseMatch && typeMatch;
  });

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleGenerate = () => {
    console.log('Generating deck with:', {
      files: useAllMaterials ? uploadedFiles.map(f => f.id) : selectedFiles,
      format: selectedFormat,
      name: deckName
    });
    onComplete();
  };

  const canGenerate = useAllMaterials || selectedFiles.length > 0;

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Create New Deck
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Select Source Materials */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            Select Source Materials
          </h4>
          
          {/* Filter Controls */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={useAllMaterials ? "default" : "outline"}
                size="sm"
                onClick={() => setUseAllMaterials(!useAllMaterials)}
                className="text-xs"
              >
                Use All Materials
              </Button>
              {!useAllMaterials && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="w-4 h-4" />
                  <span>Filter by:</span>
                </div>
              )}
            </div>
            
            {!useAllMaterials && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Course</label>
                  <div className="flex flex-wrap gap-1">
                    {courseOptions.map(course => (
                      <TagChip
                        key={course}
                        label={course}
                        color={selectedCourse === course ? 'blue' : 'default'}
                        onClick={() => setSelectedCourse(selectedCourse === course ? '' : course)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Material Type</label>
                  <div className="flex flex-wrap gap-1">
                    {materialTypes.map(type => (
                      <TagChip
                        key={type.id}
                        label={type.label}
                        color={selectedMaterialType === type.id ? 'green' : 'default'}
                        onClick={() => setSelectedMaterialType(selectedMaterialType === type.id ? '' : type.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Selection */}
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
            {filteredFiles.map(file => (
              <div
                key={file.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  useAllMaterials || selectedFiles.includes(file.id)
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => !useAllMaterials && handleFileToggle(file.id)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <div className="flex gap-2 mt-1">
                      <TagChip label={file.course} color="blue" />
                      <TagChip label={materialTypes.find(t => t.id === file.type)?.label || file.type} color="green" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Choose Format */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Choose Format
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formatOptions.map(format => (
              <div
                key={format.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  format.disabled 
                    ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                    : selectedFormat === format.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => !format.disabled && setSelectedFormat(format.id)}
              >
                <h5 className="font-medium text-sm">{format.name}</h5>
                <p className="text-xs text-gray-600 mb-2">{format.description}</p>
                <p className="text-xs text-gray-500 italic">{format.example}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Name Your Deck (Optional) */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            Name Your Deck (Optional)
          </h4>
          <Input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="e.g., Thermodynamics Week 4 Review"
            className="text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            disabled={!canGenerate}
            className="bg-gray-800 hover:bg-gray-700 flex-1"
            onClick={handleGenerate}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Flashcards
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

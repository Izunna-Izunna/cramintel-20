
import React, { useState } from 'react';
import { Upload, FileText, MessageSquare, BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { TagChip } from '@/components/dashboard/TagChip';

interface Clue {
  id: string;
  name: string;
  type: 'past-questions' | 'assignment' | 'whisper';
  content?: string;
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

  const removeClue = (id: string) => {
    onCluesChange(clues.filter(clue => clue.id !== id));
  };

  const handleFileUpload = (type: 'past-questions' | 'assignment') => {
    // Simulate file upload
    const newClue: Clue = {
      id: Date.now().toString(),
      name: type === 'past-questions' ? 'Past Questions - Week 6.pdf' : 'Assignment - Binary Mixtures.pdf',
      type
    };
    onCluesChange([...clues, newClue]);
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Your Exam Clues</h3>
        <p className="text-gray-600">Add any materials that might help predict your exam questions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFileUpload('past-questions')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-1">Past Questions</h4>
            <p className="text-sm text-gray-600 mb-3">Upload PDFs or photos</p>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFileUpload('assignment')}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold mb-1">Assignments</h4>
            <p className="text-sm text-gray-600 mb-3">Test scripts, coursework</p>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
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

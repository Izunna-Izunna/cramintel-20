
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Image, BookOpen, Plus, CheckCircle } from 'lucide-react';
import { ProgressSteps } from '../ProgressSteps';
import { TagChip } from '../TagChip';

type UploadStep = 'select' | 'details' | 'tags' | 'success';

interface UploadedFile {
  file: File;
  preview?: string;
  type: string;
}

export function EnhancedUploadSection() {
  const [currentStep, setCurrentStep] = useState<UploadStep>('select');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const steps = [
    { id: 1, title: 'Upload', completed: currentStep !== 'select' },
    { id: 2, title: 'Details', completed: ['tags', 'success'].includes(currentStep) },
    { id: 3, title: 'Tags', completed: currentStep === 'success' },
    { id: 4, title: 'Done', completed: currentStep === 'success' }
  ];

  const currentStepNumber = steps.find(step => {
    if (currentStep === 'select') return step.id === 1;
    if (currentStep === 'details') return step.id === 2;
    if (currentStep === 'tags') return step.id === 3;
    if (currentStep === 'success') return step.id === 4;
    return false;
  })?.id || 1;

  const courseOptions = ['CSC 202', 'PHY 101', 'ENG 301', 'MTH 201'];
  const topicOptions = ['Thermodynamics', 'Data Structures', 'Mechanics', 'Algorithms'];
  const typeOptions = ['Notes', 'Past Question', 'Assignment', 'Whisper'];

  const handleFileUpload = (file: File) => {
    setUploadedFile({
      file,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    });
    setFileName(file.name.replace(/\.[^/.]+$/, ''));
    setCurrentStep('details');
  };

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    setCurrentStep('success');
    setTimeout(() => {
      setCurrentStep('select');
      setUploadedFile(null);
      setFileName('');
      setSelectedTags([]);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Upload Materials</h2>
        <p className="text-gray-600">Organize your study materials with smart tagging and instant processing</p>
      </div>

      {currentStep !== 'select' && (
        <ProgressSteps steps={steps} currentStep={currentStepNumber} />
      )}

      <AnimatePresence mode="wait">
        {currentStep === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.txt,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drag & Drop Files</h3>
                  <p className="text-gray-600 mb-4">Drop your files here or click to browse</p>
                  <Button className="bg-gray-800 hover:bg-gray-700">
                    Choose Files
                  </Button>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Supported Formats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>PDF Documents</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Image className="w-4 h-4 text-green-500" />
                    <span>Images (JPG, PNG)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <span>Text Files</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Name Your Material</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-semibold">{uploadedFile?.file.name}</p>
                    <p className="text-sm text-gray-600">{(uploadedFile?.file.size || 0) / 1024 > 1024 ? 
                      `${((uploadedFile?.file.size || 0) / 1024 / 1024).toFixed(1)} MB` : 
                      `${((uploadedFile?.file.size || 0) / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                </div>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., Thermodynamics Notes - Week 4"
                  className="text-lg"
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep('select')}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('tags')}
                    disabled={!fileName.trim()}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 'tags' && (
          <motion.div
            key="tags"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Add Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Course</h4>
                  <div className="flex flex-wrap gap-2">
                    {courseOptions.map(course => (
                      <TagChip
                        key={course}
                        label={course}
                        color={selectedTags.includes(course) ? 'blue' : 'default'}
                        onClick={() => handleTagSelect(course)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Topic</h4>
                  <div className="flex flex-wrap gap-2">
                    {topicOptions.map(topic => (
                      <TagChip
                        key={topic}
                        label={topic}
                        color={selectedTags.includes(topic) ? 'green' : 'default'}
                        onClick={() => handleTagSelect(topic)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map(type => (
                      <TagChip
                        key={type}
                        label={type}
                        color={selectedTags.includes(type) ? 'purple' : 'default'}
                        onClick={() => handleTagSelect(type)}
                      />
                    ))}
                  </div>
                </div>

                {selectedTags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Selected Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map(tag => (
                        <TagChip
                          key={tag}
                          label={tag}
                          color="orange"
                          removable
                          onRemove={() => handleTagRemove(tag)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep('details')}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={selectedTags.length === 0}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    Upload & Process
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="text-center">
              <CardContent className="p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Success!</h3>
                <p className="text-gray-600 mb-4">
                  Your material has been processed. You'll now see predictions and flashcards from this content.
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline">Generate Flashcards</Button>
                  <Button className="bg-gray-800 hover:bg-gray-700">View Predictions</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

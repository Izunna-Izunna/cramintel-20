
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Image, BookOpen, Camera, CheckCircle, X } from 'lucide-react';
import { TagChip } from '../TagChip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UploadedFile {
  file: File;
  preview?: string;
  type: string;
}

export function EnhancedUploadSection() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const courseOptions = ['CSC 202', 'PHY 101', 'ENG 301', 'MTH 201', 'CHE 205'];
  const typeOptions = [
    { id: 'notes', label: 'Notes', icon: '📘' },
    { id: 'past-question', label: 'Past Question', icon: '📝' },
    { id: 'assignment', label: 'Assignment', icon: '🧪' },
    { id: 'whisper', label: 'Whisper', icon: '🤫' }
  ];

  const cleanFileName = (file: File) => {
    const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile({
      file,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    });
    setFileName(cleanFileName(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload(file);
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!uploadedFile || !selectedCourse || !selectedType || !user) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setUploadProgress(10);
    
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      setUploadProgress(30);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      formData.append('fileName', fileName);
      formData.append('course', selectedCourse);
      formData.append('materialType', selectedType);

      setUploadProgress(50);

      // Call the upload edge function
      const { data, error } = await supabase.functions.invoke('upload-material', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      setUploadProgress(80);

      if (error) {
        throw error;
      }

      setUploadProgress(100);

      toast({
        title: "Upload Successful!",
        description: "Your material has been uploaded and is being processed. You'll see it in your recent uploads soon.",
      });
      
      // Reset form
      setUploadedFile(null);
      setFileName('');
      setSelectedCourse('');
      setSelectedType('');
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setFileName('');
    setSelectedCourse('');
    setSelectedType('');
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Upload Materials</h2>
        <p className="text-gray-600">Drop it. Tag it. Let the AI handle the rest.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 relative">
          <AnimatePresence mode="wait">
            {!uploadedFile ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Upload Area */}
                <div
                  className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors rounded-lg p-8 text-center cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop your files here</h3>
                  <p className="text-gray-600 mb-4">PDF, JPG, PNG, DOCX, TXT supported</p>
                  <div className="flex gap-3 justify-center">
                    <Button className="bg-gray-800 hover:bg-gray-700">
                      Browse Files
                    </Button>
                    <Button variant="outline" onClick={(e) => {
                      e.stopPropagation();
                      handleTakePhoto();
                    }}>
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                </div>

                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.txt,.docx"
                  onChange={handleFileSelect}
                />

                {/* Supported Formats */}
                <div className="flex justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-green-500" />
                    <span>Images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-500" />
                    <span>Photos</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* File Preview */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img src={uploadedFile.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <FileText className="w-12 h-12 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{uploadedFile.file.name}</p>
                    <p className="text-sm text-gray-600">
                      {uploadedFile.file.size > 1024 * 1024 ? 
                        `${(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB` : 
                        `${(uploadedFile.file.size / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetUpload} disabled={isProcessing}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Upload Progress */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* File Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">Name (optional)</label>
                  <Input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g., Thermodynamics Week 4 Notes"
                    className="text-base"
                    disabled={isProcessing}
                  />
                </div>

                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Course</label>
                  <div className="flex flex-wrap gap-2">
                    {courseOptions.map(course => (
                      <TagChip
                        key={course}
                        label={course}
                        color={selectedCourse === course ? 'blue' : 'default'}
                        onClick={() => !isProcessing && setSelectedCourse(course)}
                      />
                    ))}
                  </div>
                </div>

                {/* Material Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Material Type</label>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map(type => (
                      <TagChip
                        key={type.id}
                        label={`${type.icon} ${type.label}`}
                        color={selectedType === type.id ? 'green' : 'default'}
                        onClick={() => !isProcessing && setSelectedType(type.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={resetUpload} disabled={isProcessing}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!selectedCourse || !selectedType || isProcessing || !user}
                    className="bg-gray-800 hover:bg-gray-700 flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload & Process
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

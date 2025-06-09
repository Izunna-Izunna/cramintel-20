
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Upload, FileImage, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface UploadPastQuestionImagesProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

interface SelectedFile {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function UploadPastQuestionImages({ onClose, onUploadComplete }: UploadPastQuestionImagesProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const userCourses = profile?.courses || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > 10) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 10 images at once.",
        variant: "destructive"
      });
      return;
    }

    const newFiles: SelectedFile[] = files
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
        progress: 0
      }));

    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Auto-generate group name if not set
    if (!groupName && newFiles.length > 0) {
      const today = new Date().toLocaleDateString();
      setGroupName(`Past Questions - ${today}`);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (!selectedCourse || selectedFiles.length === 0 || !user) {
      toast({
        title: "Missing Information",
        description: "Please select a course and add at least one image.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Generate a unique group ID for this batch
      const groupId = crypto.randomUUID();
      const finalGroupName = groupName || `Past Questions - ${new Date().toLocaleDateString()}`;

      // Upload files one by one with group information
      const uploadPromises = selectedFiles.map(async (selectedFile, index) => {
        try {
          // Update status
          setSelectedFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = { ...newFiles[index], status: 'uploading', progress: 10 };
            return newFiles;
          });

          const formData = new FormData();
          formData.append('file', selectedFile.file);
          formData.append('fileName', selectedFile.file.name.replace(/\.[^/.]+$/, ''));
          formData.append('course', selectedCourse);
          formData.append('materialType', 'past-question-images');
          formData.append('groupId', groupId);
          formData.append('groupName', finalGroupName);

          const { data, error } = await supabase.functions.invoke('upload-material', {
            body: formData,
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            }
          });

          if (error || !data.success) {
            throw new Error(data?.error || 'Upload failed');
          }

          // Update success status
          setSelectedFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = { ...newFiles[index], status: 'success', progress: 100 };
            return newFiles;
          });

          return data;
        } catch (error) {
          console.error(`Upload error for file ${index}:`, error);
          
          // Update error status
          setSelectedFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = { 
              ...newFiles[index], 
              status: 'error', 
              progress: 0,
              error: error.message 
            };
            return newFiles;
          });
          
          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (successful > 0) {
        toast({
          title: `Upload Complete! 🎉`,
          description: `${successful} image${successful === 1 ? '' : 's'} uploaded successfully as "${finalGroupName}". OCR processing started.`,
        });
        
        onUploadComplete();
        
        if (failed === 0) {
          onClose();
        }
      }

      if (failed > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failed} image${failed === 1 ? '' : 's'} failed to upload. You can retry or remove them.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: SelectedFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Upload Past Question Images</h2>
            <p className="text-gray-600">Upload multiple images to be processed as a group</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Course and Group Name Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course *</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isUploading}
              >
                <option value="">Select a course</option>
                {userCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Group Name</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., 2023 Final Exam Questions"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select Images</h3>
            <p className="text-gray-600 mb-4">Choose up to 10 images (JPG, PNG)</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="past-question-upload"
              disabled={isUploading}
            />
            <Button 
              asChild 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isUploading}
            >
              <label htmlFor="past-question-upload" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Choose Images
              </label>
            </Button>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold">Selected Images ({selectedFiles.length}/10)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedFiles.map((selectedFile, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={selectedFile.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Status overlay */}
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                      {getStatusIcon(selectedFile.status)}
                    </div>

                    {/* Remove button */}
                    {selectedFile.status === 'pending' && !isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 left-2 bg-white hover:bg-gray-100 p-1 h-auto"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}

                    {/* Progress bar for uploading */}
                    {selectedFile.status === 'uploading' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${selectedFile.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {selectedFile.status === 'error' && selectedFile.error && (
                      <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 rounded-b-lg">
                        {selectedFile.error}
                      </div>
                    )}

                    {/* File name */}
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {selectedFile.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || !selectedCourse || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {selectedFiles.length} Image{selectedFiles.length === 1 ? '' : 's'}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

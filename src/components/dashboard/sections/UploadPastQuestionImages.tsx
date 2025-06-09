
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface UploadedImage {
  file: File;
  id: string;
  preview: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
}

interface UploadPastQuestionImagesProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

export function UploadPastQuestionImages({ onClose, onUploadComplete }: UploadPastQuestionImagesProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [courseName, setCourseName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + images.length > 10) {
      toast({
        title: "Too Many Images",
        description: "You can upload a maximum of 10 images at once.",
        variant: "destructive"
      });
      return;
    }

    const newImages: UploadedImage[] = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const updateImageStatus = (id: string, status: UploadedImage['status'], progress: number = 0) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, status, progress } : img
    ));
  };

  const handleUpload = async () => {
    if (!user || !courseName.trim() || images.length === 0) {
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

      // Upload images sequentially to avoid overwhelming the system
      for (const image of images) {
        try {
          updateImageStatus(image.id, 'uploading', 20);

          const formData = new FormData();
          formData.append('file', image.file);
          formData.append('fileName', `Past Questions - ${image.file.name}`);
          formData.append('course', courseName);
          formData.append('materialType', 'past-question-images');

          updateImageStatus(image.id, 'uploading', 50);

          const { data, error } = await supabase.functions.invoke('upload-material', {
            body: formData,
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            }
          });

          if (error) {
            throw new Error(error.message);
          }

          if (!data.success) {
            throw new Error(data.error || 'Upload failed');
          }

          updateImageStatus(image.id, 'processing', 80);

          // Wait a bit for processing to start
          setTimeout(() => {
            updateImageStatus(image.id, 'completed', 100);
          }, 2000);

        } catch (error) {
          console.error(`Error uploading ${image.file.name}:`, error);
          updateImageStatus(image.id, 'error', 0);
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${image.file.name}: ${error.message}`,
            variant: "destructive"
          });
        }
      }

      // Check if all images were processed successfully
      const successfulUploads = images.filter(img => img.status === 'completed').length;
      
      if (successfulUploads > 0) {
        toast({
          title: "Upload Successful! 🎉",
          description: `${successfulUploads} past question images uploaded and processing started.`,
        });
        
        setTimeout(() => {
          onUploadComplete();
          onClose();
        }, 3000);
      }

    } catch (error) {
      console.error('Batch upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: UploadedImage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <FileImage className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: UploadedImage['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing OCR...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Upload Past Question Images</h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isUploading}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Course Name</label>
            <Input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g., Mathematics 101"
              disabled={isUploading}
            />
          </div>

          {images.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Past Question Images</h3>
              <p className="text-gray-600 mb-4">Select up to 10 images of past questions. We'll extract the text using OCR and generate flashcards.</p>
              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <Button 
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Images
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Selected Images ({images.length}/10)</h3>
                {images.length < 10 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add More
                  </Button>
                )}
              </div>

              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={isUploading}
              />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {images.map((image) => (
                  <Card key={image.id} className="relative">
                    <CardContent className="p-3">
                      <div className="aspect-square relative mb-3">
                        <img
                          src={image.preview}
                          alt="Past question"
                          className="w-full h-full object-cover rounded"
                        />
                        {!isUploading && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 w-6 h-6 bg-white/80 hover:bg-white"
                            onClick={() => removeImage(image.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {getStatusIcon(image.status)}
                        <span className="truncate">{getStatusText(image.status)}</span>
                      </div>
                      {image.status === 'uploading' || image.status === 'processing' ? (
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                            style={{ width: `${image.progress}%` }}
                          />
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!courseName.trim() || images.length === 0 || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing Images...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process ({images.length} images)
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

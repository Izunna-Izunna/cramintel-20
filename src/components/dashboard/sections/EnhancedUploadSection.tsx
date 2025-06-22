
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Image, BookOpen, Camera, CheckCircle, X, AlertCircle, Plus } from 'lucide-react';
import { TagChip } from '../TagChip';
import { UploadedMaterialsList } from './UploadedMaterialsList';
import { ProcessingAnimation } from '@/components/ProcessingAnimation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface UploadedFile {
  file: File;
  preview?: string;
  type: string;
}

type ProcessingStatus = 'pending' | 'extracting_text' | 'processing_content' | 'generating_flashcards' | 'saving_flashcards' | 'completed' | 'error';

export function EnhancedUploadSection() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('pending');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showProcessing, setShowProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();

  const courseOptions = ['CSC 202', 'PHY 101', 'ENG 301', 'MTH 201', 'CHE 205', 'BIO 101', 'HIST 201'];
  const typeOptions = [
    { id: 'notes', label: 'Notes', icon: '📘' },
    { id: 'past-question', label: 'Past Question', icon: '📝' },
    { id: 'assignment', label: 'Assignment', icon: '🧪' },
    { id: 'textbook', label: 'Textbook', icon: '📚' },
    { id: 'lecture', label: 'Lecture Material', icon: '🎓' }
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

  // Real-time processing status monitoring
  const monitorProcessingStatus = (materialId: string) => {
    const checkStatus = async () => {
      try {
        const { data: material, error } = await supabase
          .from('cramintel_materials')
          .select('processed, processing_status, processing_progress')
          .eq('id', materialId)
          .single();

        if (error) {
          console.error('Error checking status:', error);
          return;
        }

        console.log('Processing status:', material);

        if (material.processing_status) {
          setProcessingStatus(material.processing_status as ProcessingStatus);
        }
        if (material.processing_progress !== undefined) {
          setProcessingProgress(material.processing_progress);
        }

        // If completed successfully
        if (material.processed && material.processing_status === 'completed') {
          setShowProcessing(false);
          setRefreshKey(prev => prev + 1);
          toast({
            title: "Processing Complete! ✨",
            description: "20 flashcards have been generated and are ready for study.",
          });
          return;
        }

        // If failed
        if (material.processing_status === 'error') {
          setShowProcessing(false);
          toast({
            title: "Processing Failed ❌",
            description: "There was an error processing your material. Please try uploading again.",
            variant: "destructive"
          });
          return;
        }

        // Continue monitoring if still processing
        if (!material.processed) {
          setTimeout(checkStatus, 2000); // Check every 2 seconds
        }
      } catch (error) {
        console.error('Error monitoring status:', error);
      }
    };

    checkStatus();
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      setUploadProgress(30);

      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      formData.append('fileName', fileName);
      formData.append('course', selectedCourse);
      formData.append('materialType', selectedType);

      setUploadProgress(50);

      console.log('Calling upload-material function...');
      const { data, error } = await supabase.functions.invoke('upload-material', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      setUploadProgress(80);

      if (error) {
        console.error('Upload function error:', error);
        throw error;
      }

      console.log('Upload response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadProgress(100);

      // Check if processing was triggered successfully
      if (data.processingTriggered) {
        toast({
          title: "Upload Successful! 🎉",
          description: "Your material is being processed. 20 quality flashcards will be generated automatically.",
        });
        
        // Start monitoring processing status
        setCurrentMaterialId(data.material.id);
        setShowProcessing(true);
        setProcessingStatus('extracting_text');
        setProcessingProgress(10);
        
        // Start real-time monitoring
        monitorProcessingStatus(data.material.id);
      } else {
        toast({
          title: "Upload Successful ⚠️",
          description: "Material uploaded but processing may need to be started manually.",
          variant: "destructive"
        });
      }
      
      // Reset form
      setUploadedFile(null);
      setFileName('');
      setSelectedCourse('');
      setSelectedType('');
      setUploadProgress(0);
      
      setRefreshKey(prev => prev + 1);
      
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
    setShowProcessing(false);
    setCurrentMaterialId(null);
  };

  // Get user's courses
  const userCourses = profile?.courses || [];
  const hasCourses = userCourses.length > 0;

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Upload Materials</h2>
        <p className="text-gray-600">
          Upload any study material - PDFs, images, documents, or past questions. AI will create 20 quality flashcards automatically.
          {hasCourses && ` (${userCourses.length} course${userCourses.length === 1 ? '' : 's'} available)`}
        </p>
      </div>

      {/* Processing Animation Overlay */}
      <AnimatePresence>
        {showProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <ProcessingAnimation
                status={processingStatus}
                progress={processingProgress}
                fileName={fileName}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasCourses ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Courses Added Yet</h3>
            <p className="text-gray-600 mb-6">
              You need to add courses to your profile before you can upload materials.
            </p>
            <Button 
              onClick={() => {
                // Navigate to profile section - you might want to implement proper navigation
                const profileSection = document.querySelector('[data-section="profile"]');
                if (profileSection) {
                  profileSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-gray-800 hover:bg-gray-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Courses in Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                  <div
                    className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors rounded-lg p-8 text-center cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Drop your study materials here</h3>
                    <p className="text-gray-600 mb-4">PDF, JPG, PNG, DOCX, TXT supported • Works with notes, textbooks, and past questions • AI generates 20 flashcards</p>
                    <div className="flex gap-3 justify-center">
                      <Button className="bg-gray-800 hover:bg-gray-700">
                        Browse Files
                      </Button>
                      <Button variant="outline" onClick={handleTakePhoto}>
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

                  <div className="flex justify-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span>Documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-green-500" />
                      <span>Images</span>
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

                  <div>
                    <label className="block text-sm font-medium mb-2">Course</label>
                    <div className="flex flex-wrap gap-2">
                      {userCourses.map(course => (
                        <TagChip
                          key={course}
                          label={course}
                          color={selectedCourse === course ? 'blue' : 'gray'}
                          onClick={() => !isProcessing && setSelectedCourse(course)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Material Type</label>
                    <div className="flex flex-wrap gap-2">
                      {typeOptions.map(type => (
                        <TagChip
                          key={type.id}
                          label={`${type.icon} ${type.label}`}
                          color={selectedType === type.id ? 'green' : 'gray'}
                          onClick={() => !isProcessing && setSelectedType(type.id)}
                        />
                      ))}
                    </div>
                  </div>

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
                          Upload & Generate 20 Flashcards
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      <UploadedMaterialsList key={refreshKey} />
    </div>
  );
}

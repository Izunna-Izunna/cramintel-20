
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Image, BookOpen, Camera, CheckCircle, X, AlertCircle, Plus, FileImage, Files } from 'lucide-react';
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

interface SelectedFile {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

type ProcessingStatus = 'pending' | 'extracting_text' | 'processing_content' | 'generating_flashcards' | 'saving_flashcards' | 'completed' | 'error';
type UploadMode = 'single' | 'batch';

export function EnhancedUploadSection() {
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  
  // Single upload states
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Batch upload states
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [groupName, setGroupName] = useState('');
  
  // Common states
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('pending');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showProcessing, setShowProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const courseOptions = ['CSC 202', 'PHY 101', 'ENG 301', 'MTH 201', 'CHE 205', 'BIO 101', 'HIST 201'];
  const typeOptions = [
    { id: 'notes', label: 'Notes', icon: '📘' },
    { id: 'past-question', label: 'Past Question', icon: '📝' },
    { id: 'assignment', label: 'Assignment', icon: '🧪' },
    { id: 'textbook', label: 'Textbook', icon: '📚' },
    { id: 'lecture', label: 'Lecture Material', icon: '🎓' }
  ];

  const cleanFileName = (file: File) => {
    const name = file.name.replace(/\.[^/.]+$/, '');
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Single file upload handler
  const handleSingleFileUpload = (file: File) => {
    setUploadedFile({
      file,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    });
    setFileName(cleanFileName(file));
  };

  // Batch file upload handler
  const handleBatchFileSelect = (files: File[]) => {
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

    if (!groupName && newFiles.length > 0) {
      const today = new Date().toLocaleDateString();
      setGroupName(`Past Questions - ${today}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    if (uploadMode === 'single') {
      const file = files[0];
      if (file) handleSingleFileUpload(file);
    } else {
      handleBatchFileSelect(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (uploadMode === 'single') {
      const file = files[0];
      if (file) handleSingleFileUpload(file);
    } else {
      handleBatchFileSelect(files);
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

        if (material.processed && material.processing_status === 'completed') {
          setShowProcessing(false);
          setRefreshKey(prev => prev + 1);
          toast({
            title: "Processing Complete! ✨",
            description: "20 flashcards have been generated and are ready for study.",
          });
          return;
        }

        if (material.processing_status === 'error') {
          setShowProcessing(false);
          toast({
            title: "Processing Failed ❌",
            description: "There was an error processing your material. Please try uploading again.",
            variant: "destructive"
          });
          return;
        }

        if (!material.processed) {
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Error monitoring status:', error);
      }
    };

    checkStatus();
  };

  // Single file submit handler
  const handleSingleSubmit = async () => {
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

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadProgress(100);

      if (data.processingTriggered) {
        toast({
          title: "Upload Successful! 🎉",
          description: "Your material is being processed. 20 quality flashcards will be generated automatically.",
        });
        
        setCurrentMaterialId(data.material.id);
        setShowProcessing(true);
        setProcessingStatus('extracting_text');
        setProcessingProgress(10);
        
        monitorProcessingStatus(data.material.id);
      } else {
        toast({
          title: "Upload Successful ⚠️",
          description: "Material uploaded but processing may need to be started manually.",
          variant: "destructive"
        });
      }
      
      resetUpload();
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

  // Batch upload submit handler
  const handleBatchSubmit = async () => {
    if (!selectedCourse || selectedFiles.length === 0 || !user) {
      toast({
        title: "Missing Information",
        description: "Please select a course and add at least one image.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const groupId = crypto.randomUUID();
      const finalGroupName = groupName || `Past Questions - ${new Date().toLocaleDateString()}`;

      const uploadPromises = selectedFiles.map(async (selectedFile, index) => {
        try {
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

          setSelectedFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = { ...newFiles[index], status: 'success', progress: 100 };
            return newFiles;
          });

          return data;
        } catch (error) {
          console.error(`Upload error for file ${index}:`, error);
          
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
        
        setRefreshKey(prev => prev + 1);
        
        if (failed === 0) {
          resetUpload();
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
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setSelectedFiles([]);
    setFileName('');
    setGroupName('');
    setSelectedCourse('');
    setSelectedType('');
    setUploadProgress(0);
    setShowProcessing(false);
    setCurrentMaterialId(null);
  };

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
          Upload single files or batch upload past question images. Let AI create quality flashcards.
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
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Upload Materials</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={uploadMode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setUploadMode('single');
                    resetUpload();
                  }}
                  disabled={isProcessing}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Single File
                </Button>
                <Button
                  variant={uploadMode === 'batch' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setUploadMode('batch');
                    resetUpload();
                  }}
                  disabled={isProcessing}
                >
                  <Files className="w-4 h-4 mr-2" />
                  Past Questions
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors rounded-lg p-8 text-center cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {uploadMode === 'single' ? (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop your study material here</h3>
                  <p className="text-gray-600 mb-4">PDF, JPG, PNG, DOCX, TXT supported • AI will generate 20 flashcards</p>
                </>
              ) : (
                <>
                  <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop past question images here</h3>
                  <p className="text-gray-600 mb-4">Upload up to 10 images • OCR will extract text automatically</p>
                </>
              )}
              <Button className="bg-gray-800 hover:bg-gray-700">
                {uploadMode === 'single' ? 'Browse Files' : 'Select Images'}
              </Button>
            </div>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept={uploadMode === 'single' ? '.pdf,.jpg,.jpeg,.png,.txt,.docx' : 'image/*'}
              multiple={uploadMode === 'batch'}
              onChange={handleFileSelect}
            />

            {/* Single File Preview */}
            {uploadMode === 'single' && uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
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
              </motion.div>
            )}

            {/* Batch Upload Preview */}
            {uploadMode === 'batch' && selectedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Course</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing}
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
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
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
                        
                        <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                          {getStatusIcon(selectedFile.status)}
                        </div>

                        {selectedFile.status === 'pending' && !isProcessing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 left-2 bg-white hover:bg-gray-100 p-1 h-auto"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}

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

                        {selectedFile.status === 'error' && selectedFile.error && (
                          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 rounded-b-lg">
                            {selectedFile.error}
                          </div>
                        )}

                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {selectedFile.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            {(uploadedFile || selectedFiles.length > 0) && (
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={resetUpload} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button 
                  onClick={uploadMode === 'single' ? handleSingleSubmit : handleBatchSubmit}
                  disabled={
                    uploadMode === 'single' 
                      ? (!selectedCourse || !selectedType || !uploadedFile || isProcessing) 
                      : (!selectedCourse || selectedFiles.length === 0 || isProcessing)
                  }
                  className="bg-gray-800 hover:bg-gray-700 flex-1"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {uploadMode === 'single' ? 'Processing...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadMode === 'single' 
                        ? 'Upload & Generate 20 Flashcards'
                        : `Upload ${selectedFiles.length} Image${selectedFiles.length === 1 ? '' : 's'}`
                      }
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <UploadedMaterialsList key={refreshKey} />
    </div>
  );
}

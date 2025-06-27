
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Image, Eye, Play, AlertCircle, CheckCircle, Clock, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProcessingAnimation } from '@/components/ProcessingAnimation';
import { useMaterials } from '@/hooks/useMaterials';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadedMaterialsListProps {
  onSectionChange?: (section: string) => void;
}

export function UploadedMaterialsList({ onSectionChange }: UploadedMaterialsListProps) {
  const { materialGroups, loading, fetchMaterials } = useMaterials();
  const [processingMaterials, setProcessingMaterials] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Poll for processing updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (processingMaterials.size > 0) {
        fetchMaterials();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [processingMaterials.size, fetchMaterials]);

  // Track processing materials
  useEffect(() => {
    const processing = new Set<string>();
    materialGroups.forEach(group => {
      group.materials.forEach(material => {
        if (material.processing_status === 'processing' || 
            material.processing_status === 'extracting_text' || 
            material.processing_status === 'generating_flashcards' || 
            material.processing_status === 'saving_flashcards') {
          processing.add(material.id);
        }
      });
    });
    setProcessingMaterials(processing);
  }, [materialGroups]);

  const handleRetryProcessing = async (materialId: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-material', {
        body: { materialId }
      });

      if (error) {
        console.error('Error retrying processing:', error);
        toast({
          title: "Retry Failed",
          description: "Failed to retry processing. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Processing Restarted",
          description: "The material is being processed again.",
        });
        fetchMaterials();
      }
    } catch (error) {
      console.error('Error retrying processing:', error);
      toast({
        title: "Retry Failed",
        description: "Failed to retry processing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('cramintel_materials')
        .delete()
        .eq('id', materialId);

      if (error) {
        console.error('Error deleting material:', error);
        toast({
          title: "Delete Failed",
          description: "Failed to delete material. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Material Deleted",
          description: "The material has been deleted successfully.",
        });
        fetchMaterials();
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete material. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (material: any) => {
    switch (material.processing_status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'processing':
      case 'extracting_text':
      case 'generating_flashcards':
      case 'saving_flashcards':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('image')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading materials...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (materialGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No materials uploaded yet</p>
            <Button onClick={() => onSectionChange?.('upload')} className="bg-gray-800 hover:bg-gray-900 text-white">
              Upload Your First Material
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Recent Uploads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {materialGroups.slice(0, 5).map((group) => (
            <motion.div
              key={group.group_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getFileIcon(group.materials[0]?.file_type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate">{group.group_name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {group.materials[0]?.course || 'No course specified'}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(group.materials[0])}
                      <span className="text-xs text-gray-500">
                        {group.total_count} file{group.total_count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(group.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {group.materials[0]?.processing_status === 'error' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetryProcessing(group.materials[0].id)}
                      className="text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMaterial(group.materials[0].id)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Show processing animation for active processing */}
              {(group.materials[0]?.processing_status === 'processing' || 
                group.materials[0]?.processing_status === 'extracting_text' || 
                group.materials[0]?.processing_status === 'generating_flashcards' || 
                group.materials[0]?.processing_status === 'saving_flashcards') && (
                <div className="mt-4">
                  <ProcessingAnimation
                    status={group.materials[0].processing_status}
                    progress={group.materials[0].processing_progress || 0}
                    fileName={group.materials[0].file_name}
                  />
                </div>
              )}

              {/* Show error message for failed processing */}
              {group.materials[0]?.processing_status === 'error' && group.materials[0]?.error_message && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-red-800">Processing Failed</h5>
                      <p className="text-sm text-red-700 mt-1">{group.materials[0].error_message}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {materialGroups.length > 5 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => onSectionChange?.('upload')}
              className="text-sm"
            >
              View All Materials
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

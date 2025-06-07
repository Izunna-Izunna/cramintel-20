import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Trash2, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFViewer } from './PDFViewer';

interface Material {
  id: string;
  name: string;
  material_type: string;
  course: string;
  upload_date: string;
  processed: boolean;
  file_type: string;
  file_size: number;
  file_path?: string;
}

export function UploadedMaterialsList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);
  const [loadingFileUrl, setLoadingFileUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMaterials();
    }
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('cramintel_materials')
        .select('id, name, material_type, course, upload_date, processed, file_type, file_size, file_path')
        .eq('user_id', user?.id)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching materials:', error);
        return;
      }

      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      // First get the material to find the file path
      const { data: material } = await supabase
        .from('cramintel_materials')
        .select('file_path')
        .eq('id', materialId)
        .eq('user_id', user?.id)
        .single();

      // Delete the file from storage if it exists
      if (material?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('cramintel-materials')
          .remove([material.file_path]);
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }
      }

      // Delete the database record
      const { error } = await supabase
        .from('cramintel_materials')
        .delete()
        .eq('id', materialId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting material:', error);
        toast({
          title: "Error",
          description: "Failed to delete material. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Material deleted successfully.",
      });
      
      // Refresh the list
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "Failed to delete material. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewMaterial = async (material: Material) => {
    if (material.file_type !== 'application/pdf') {
      toast({
        title: "Preview Not Available",
        description: "PDF preview is currently only available for PDF files.",
        variant: "destructive"
      });
      return;
    }

    if (!material.file_path) {
      toast({
        title: "File Not Available",
        description: "The file path is not available for this material.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoadingFileUrl(material.id);
      
      // Generate a signed URL for the file
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('cramintel-materials')
        .createSignedUrl(material.file_path, 3600); // URL valid for 1 hour

      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        toast({
          title: "Error",
          description: "Failed to access the file. The file may not exist in storage.",
          variant: "destructive"
        });
        return;
      }

      if (!signedUrlData.signedUrl) {
        toast({
          title: "Error",
          description: "Failed to generate file access URL.",
          variant: "destructive"
        });
        return;
      }

      setSelectedPdf({
        url: signedUrlData.signedUrl,
        name: material.name
      });
      setPdfViewerOpen(true);
    } catch (error) {
      console.error('Error opening file:', error);
      toast({
        title: "Error",
        description: "Failed to open file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingFileUrl(null);
    }
  };

  const getIcon = (materialType: string) => {
    switch (materialType) {
      case 'notes':
        return '📘';
      case 'past-question':
        return '📝';
      case 'assignment':
        return '🧪';
      case 'whisper':
        return '🤫';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes > 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
            📂 Your Materials
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
              📂 Your Materials ({materials.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchMaterials}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3">
            {materials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No materials uploaded yet. Upload your first study material above!</p>
              </div>
            ) : (
              materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-300">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-xl">{getIcon(material.material_type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-800 truncate">{material.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{material.course}</span>
                        <span>•</span>
                        <span>{formatFileSize(material.file_size)}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(material.upload_date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {material.processed ? (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                          Processed
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                          Processing...
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {material.processed && material.file_type === 'application/pdf' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-gray-800"
                        onClick={() => handleViewMaterial(material)}
                        disabled={loadingFileUrl === material.id}
                      >
                        {loadingFileUrl === material.id ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => handleDelete(material.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <PDFViewer
          isOpen={pdfViewerOpen}
          onClose={() => {
            setPdfViewerOpen(false);
            setSelectedPdf(null);
          }}
          fileUrl={selectedPdf.url}
          fileName={selectedPdf.name}
        />
      )}
    </>
  );
}

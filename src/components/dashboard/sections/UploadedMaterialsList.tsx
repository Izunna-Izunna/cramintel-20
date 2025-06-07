
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Image, Video, Music, Archive, Brain, Play, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPdfViewer } from '@/components/ui/EnhancedPdfViewer';
import { EnhancedImageViewer } from '@/components/ui/EnhancedImageViewer';

interface Material {
  id: string;
  name: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  course: string;
  material_type: string;
  upload_date: string;
  processed: boolean;
  processing_status: string;
  processing_progress: number;
  tags: string[];
  flashcard_count?: number;
  deck_name?: string;
  deck_id?: string;
}

interface UploadedMaterialsListProps {
  key?: number;
}

export function UploadedMaterialsList({ key }: UploadedMaterialsListProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMaterials();
    }
  }, [user, key]);

  const fetchMaterials = async () => {
    try {
      // First get materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('cramintel_materials')
        .select('*')
        .eq('user_id', user?.id)
        .order('upload_date', { ascending: false });

      if (materialsError) {
        console.error('Error fetching materials:', materialsError);
        return;
      }

      // Then get flashcard counts and deck info for each material
      const materialsWithCounts = await Promise.all(
        materialsData?.map(async (material) => {
          // Get flashcard count for this material
          const { data: flashcardData } = await supabase
            .from('cramintel_flashcards')
            .select('id')
            .eq('material_id', material.id);

          // Get deck info if there are flashcards
          let deckInfo = null;
          if (flashcardData && flashcardData.length > 0) {
            const { data: deckData } = await supabase
              .from('cramintel_deck_flashcards')
              .select(`
                deck_id,
                cramintel_decks(id, name)
              `)
              .eq('flashcard_id', flashcardData[0].id)
              .limit(1)
              .single();

            if (deckData && deckData.cramintel_decks) {
              deckInfo = deckData.cramintel_decks;
            }
          }

          return {
            ...material,
            processing_status: material.processing_status || 'pending',
            processing_progress: material.processing_progress || 0,
            flashcard_count: flashcardData?.length || 0,
            deck_name: deckInfo?.name,
            deck_id: deckInfo?.id
          };
        }) || []
      );

      setMaterials(materialsWithCounts);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (fileType?.includes('image')) return <Image className="w-8 h-8 text-green-500" />;
    if (fileType?.includes('video')) return <Video className="w-8 h-8 text-blue-500" />;
    if (fileType?.includes('audio')) return <Music className="w-8 h-8 text-purple-500" />;
    return <Archive className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const handleViewMaterial = async (material: Material) => {
    const { data, error } = await supabase.storage
      .from('cramintel-materials')
      .createSignedUrl(material.file_path, 3600);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load file",
        variant: "destructive"
      });
      return;
    }

    setSelectedMaterial({ ...material, file_path: data.signedUrl });
    setViewerOpen(true);
  };

  const handleStudyFlashcards = (deckId: string) => {
    // Navigate to flashcards section with this deck selected
    window.location.hash = 'flashcards';
    toast({
      title: "Flashcards Ready",
      description: "Navigate to the Flashcards section to study your generated cards"
    });
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('cramintel_materials')
        .delete()
        .eq('id', materialId)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Material deleted successfully"
      });
      
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📚 Your Study Materials
            <Badge variant="secondary">{materials.length} files</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No materials uploaded yet</p>
              <p className="text-sm">Upload some study materials to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {materials.map((material) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(material.file_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 truncate">{material.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {material.course} • {material.material_type} • {formatFileSize(material.file_size)}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {material.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {material.processed ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                            <Brain className="w-4 h-4" />
                            <span>{material.flashcard_count || 0} flashcards generated</span>
                            {material.deck_name && (
                              <span className="text-gray-500">• Deck: {material.deck_name}</span>
                            )}
                          </div>
                        ) : (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Processing...</span>
                              <span>{material.processing_progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${material.processing_progress || 0}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Uploaded {formatTimeAgo(material.upload_date)}
                          </span>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewMaterial(material)}
                            >
                              View
                            </Button>
                            
                            {material.processed && material.deck_id && (
                              <Button
                                size="sm"
                                onClick={() => handleStudyFlashcards(material.deck_id!)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Study
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteMaterial(material.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMaterial && (
        <>
          {selectedMaterial.file_type?.includes('pdf') && (
            <EnhancedPdfViewer
              isOpen={viewerOpen}
              onClose={() => setViewerOpen(false)}
              sourceUrl={selectedMaterial.file_path}
              fileName={selectedMaterial.name}
            />
          )}
          
          {selectedMaterial.file_type?.includes('image') && (
            <EnhancedImageViewer
              isOpen={viewerOpen}
              onClose={() => setViewerOpen(false)}
              sourceUrl={selectedMaterial.file_path}
              fileName={selectedMaterial.name}
            />
          )}
        </>
      )}
    </>
  );
}


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Paperclip, X, FileText, Image, Upload, Search, Loader2 } from 'lucide-react';
import { Material, useMaterials } from '@/hooks/useMaterials';
import { supabase } from '@/integrations/supabase/client';

interface AttachedMaterial {
  id: string;
  name: string;
  type: 'material' | 'upload';
  content?: string;
}

interface MaterialAttachmentProps {
  attachedMaterials: AttachedMaterial[];
  onAttach: (materials: AttachedMaterial[]) => void;
  onDetach: (materialId: string) => void;
}

export function MaterialAttachment({ attachedMaterials, onAttach, onDetach }: MaterialAttachmentProps) {
  const [showMaterialBrowser, setShowMaterialBrowser] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState<Set<string>>(new Set());
  const { materials, loading } = useMaterials();

  const handleAttachMaterial = async (material: Material) => {
    if (attachedMaterials.find(m => m.id === material.id)) {
      setShowMaterialBrowser(false);
      return;
    }

    setLoadingMaterials(prev => new Set(prev).add(material.id));

    try {
      // Attempt to fetch material content if available
      let content = '';
      
      try {
        const { data, error } = await supabase
          .from('cramintel_materials')
          .select('*')
          .eq('id', material.id)
          .single();

        if (!error && data) {
          content = `Material: ${data.name}\nType: ${data.material_type || 'Unknown'}\nCourse: ${data.course || 'Unknown'}`;
          
          // If there's a file path, we could potentially fetch more content
          if (data.file_path) {
            content += `\nFile: ${data.file_name}`;
          }
        }
      } catch (error) {
        console.warn('Could not fetch material content:', error);
        content = `Material: ${material.name}\nType: ${material.material_type}\nCourse: ${material.course}`;
      }

      const attachedMaterial: AttachedMaterial = {
        id: material.id,
        name: material.name,
        type: 'material',
        content
      };
      
      onAttach([...attachedMaterials, attachedMaterial]);
      setShowMaterialBrowser(false);
    } catch (error) {
      console.error('Error attaching material:', error);
    } finally {
      setLoadingMaterials(prev => {
        const newSet = new Set(prev);
        newSet.delete(material.id);
        return newSet;
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const attachedMaterial: AttachedMaterial = {
        id: `upload-${Date.now()}`,
        name: file.name,
        type: 'upload',
        content: e.target?.result as string
      };
      onAttach([...attachedMaterials, attachedMaterial]);
    };

    // Handle different file types
    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      // For other file types, just store basic info
      const attachedMaterial: AttachedMaterial = {
        id: `upload-${Date.now()}`,
        name: file.name,
        type: 'upload',
        content: `Uploaded file: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.type || 'Unknown'}`
      };
      onAttach([...attachedMaterials, attachedMaterial]);
    }

    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Attached Materials</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMaterialBrowser(!showMaterialBrowser)}
            className="text-xs"
          >
            <Search className="w-3 h-3 mr-1" />
            Browse Materials
          </Button>
          <label>
            <Button variant="outline" size="sm" className="text-xs cursor-pointer" asChild>
              <span>
                <Upload className="w-3 h-3 mr-1" />
                Upload File
              </span>
            </Button>
            <input
              type="file"
              className="hidden"
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {attachedMaterials.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachedMaterials.map((material) => (
            <Badge
              key={material.id}
              variant="secondary"
              className="flex items-center gap-1 bg-gray-100 text-gray-700 max-w-xs"
            >
              {material.type === 'material' ? (
                <FileText className="w-3 h-3" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              <span className="text-xs truncate">{material.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4 hover:bg-gray-200"
                onClick={() => onDetach(material.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {showMaterialBrowser && (
        <Card className="border border-gray-200">
          <CardContent className="p-3">
            <h4 className="text-sm font-medium mb-2">Your Materials</h4>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading materials...
              </div>
            ) : materials.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {materials.map((material) => {
                  const isAttached = attachedMaterials.find(m => m.id === material.id) !== undefined;
                  const isLoading = loadingMaterials.has(material.id);
                  
                  return (
                    <button
                      key={material.id}
                      onClick={() => handleAttachMaterial(material)}
                      disabled={isAttached || isLoading}
                      className="w-full text-left p-2 rounded hover:bg-gray-50 flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      ) : (
                        <FileText className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="flex-1 truncate">{material.name}</span>
                      <span className="text-gray-400">
                        ({material.course || 'No course'})
                      </span>
                      {isAttached && (
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No materials available. Upload some materials first!</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

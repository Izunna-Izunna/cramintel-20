
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Paperclip, X, FileText, Image, Upload, Search } from 'lucide-react';
import { Material, useMaterials } from '@/hooks/useMaterials';

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
  const { materials, loading } = useMaterials();

  const handleAttachMaterial = (material: Material) => {
    const attachedMaterial: AttachedMaterial = {
      id: material.id,
      name: material.name,
      type: 'material'
    };
    
    if (!attachedMaterials.find(m => m.id === material.id)) {
      onAttach([...attachedMaterials, attachedMaterial]);
    }
    setShowMaterialBrowser(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      reader.readAsText(file);
    }
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
            Browse
          </Button>
          <label>
            <Button variant="outline" size="sm" className="text-xs cursor-pointer" asChild>
              <span>
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </span>
            </Button>
            <input
              type="file"
              className="hidden"
              accept=".txt,.pdf,.md"
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
              className="flex items-center gap-1 bg-gray-100 text-gray-700"
            >
              {material.type === 'material' ? (
                <FileText className="w-3 h-3" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              <span className="text-xs">{material.name}</span>
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
              <p className="text-xs text-gray-500">Loading materials...</p>
            ) : materials.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {materials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => handleAttachMaterial(material)}
                    className="w-full text-left p-2 rounded hover:bg-gray-50 flex items-center gap-2 text-xs"
                    disabled={attachedMaterials.find(m => m.id === material.id) !== undefined}
                  >
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="flex-1 truncate">{material.name}</span>
                    <span className="text-gray-400">({material.course})</span>
                  </button>
                ))}
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

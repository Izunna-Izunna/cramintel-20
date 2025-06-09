
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Image, Video, Music, Archive, Users, ChevronRight, Upload } from 'lucide-react';
import { useMaterials, Material, MaterialGroup } from '@/hooks/useMaterials';
import { Skeleton } from '@/components/ui/skeleton';

interface UploadCluesStepProps {
  selectedMaterials: string[];
  onMaterialsChange: (materials: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function UploadCluesStep({ 
  selectedMaterials, 
  onMaterialsChange, 
  onNext, 
  onBack 
}: UploadCluesStepProps) {
  const { materials, materialGroups, loading } = useMaterials();
  const [showUploadHint, setShowUploadHint] = useState(false);

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (fileType?.includes('image')) return <Image className="w-6 h-6 text-green-500" />;
    if (fileType?.includes('video')) return <Video className="w-6 h-6 text-blue-500" />;
    if (fileType?.includes('audio')) return <Music className="w-6 h-6 text-purple-500" />;
    return <Archive className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleMaterialToggle = (materialId: string) => {
    const newSelection = selectedMaterials.includes(materialId)
      ? selectedMaterials.filter(id => id !== materialId)
      : [...selectedMaterials, materialId];
    onMaterialsChange(newSelection);
  };

  const handleGroupToggle = (group: MaterialGroup) => {
    const groupMaterialIds = group.materials.map(m => m.id);
    const allSelected = groupMaterialIds.every(id => selectedMaterials.includes(id));
    
    if (allSelected) {
      // Unselect all materials in this group
      const newSelection = selectedMaterials.filter(id => !groupMaterialIds.includes(id));
      onMaterialsChange(newSelection);
    } else {
      // Select all materials in this group
      const newSelection = [...new Set([...selectedMaterials, ...groupMaterialIds])];
      onMaterialsChange(newSelection);
    }
  };

  // Get individual materials (not part of any group)
  const individualMaterials = materials.filter(material => !material.group_id);
  
  // Get grouped materials
  const groups = materialGroups.filter(group => group.materials.length > 1);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-xl font-semibold mb-2">Select Study Materials</h3>
          <p className="text-gray-600">Choose the materials you want to use for generating predictions.</p>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </motion.div>
    );
  }

  const hasNoMaterials = individualMaterials.length === 0 && groups.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-semibold mb-2">Select Study Materials</h3>
        <p className="text-gray-600">Choose the materials you want to use for generating predictions.</p>
      </div>

      {hasNoMaterials ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No materials uploaded yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Upload some study materials first to generate predictions.
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                window.location.hash = 'upload';
                setShowUploadHint(true);
              }}
            >
              Go to Upload Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Material Groups */}
          {groups.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Material Groups
              </h4>
              {groups.map((group) => {
                const groupMaterialIds = group.materials.map(m => m.id);
                const allSelected = groupMaterialIds.every(id => selectedMaterials.includes(id));
                const someSelected = groupMaterialIds.some(id => selectedMaterials.includes(id));
                
                return (
                  <Card key={group.group_id} className="border hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected;
                          }}
                          onCheckedChange={() => handleGroupToggle(group)}
                        />
                        <div className="flex-1">
                          <CardTitle className="text-base">{group.group_name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{group.total_count} files</span>
                            <span>•</span>
                            <span>{group.processed_count} processed</span>
                          </div>
                        </div>
                        <Badge variant="secondary">Group</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.materials.map((material) => (
                          <div key={material.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            {getFileIcon(material.file_type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{material.name}</p>
                              <p className="text-xs text-gray-600">
                                {formatFileSize(material.file_size)}
                              </p>
                            </div>
                            {material.processed && (
                              <Badge variant="outline" className="text-xs">
                                ✓ Processed
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Individual Materials */}
          {individualMaterials.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Individual Materials</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {individualMaterials.map((material) => (
                  <Card 
                    key={material.id} 
                    className={`cursor-pointer transition-all ${
                      selectedMaterials.includes(material.id) 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleMaterialToggle(material.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedMaterials.includes(material.id)}
                          onCheckedChange={() => handleMaterialToggle(material.id)}
                        />
                        {getFileIcon(material.file_type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{material.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {material.course} • {material.material_type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(material.file_size)}
                          </p>
                        </div>
                        {material.processed && (
                          <Badge variant="outline" className="text-xs">
                            ✓ Processed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={selectedMaterials.length === 0}
          className="flex items-center gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

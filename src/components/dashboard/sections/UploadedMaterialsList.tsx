
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Image, Video, Music, Archive, Play, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useMaterials } from '@/hooks/useMaterials';

interface UploadedMaterialsListProps {
  onSectionChange?: (section: string) => void;
}

export function UploadedMaterialsList({ onSectionChange }: UploadedMaterialsListProps) {
  const { materials, loading } = useMaterials();
  const [showAll, setShowAll] = useState(false);

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

  const displayedMaterials = showAll ? materials : materials.slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-space">📚 Your Study Materials</h2>
          <p className="text-gray-600">Your uploaded study materials</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-space">📚 Your Study Materials</h2>
          <p className="text-gray-600">Your uploaded study materials</p>
        </div>
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No materials uploaded yet</h3>
              <p className="text-gray-600 mb-6">Upload your study materials to get started with flashcards and predictions</p>
              <Button 
                onClick={() => onSectionChange?.('upload')}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Upload Materials
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-space">📚 Your Study Materials</h2>
        <p className="text-gray-600">Your uploaded study materials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedMaterials.map((material) => (
          <Card
            key={material.id}
            className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl group cursor-pointer"
          >
            <CardHeader className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                    {getFileIcon(material.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate font-space">
                      {material.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {material.course}
                    </p>
                  </div>
                </div>
                {material.processed && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    ✓ Processed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{material.material_type}</span>
                  <span>{formatFileSize(material.file_size)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  {material.processed && (
                    <Button
                      size="sm"
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                      onClick={() => onSectionChange?.('flashcards')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Study
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {materials.length > 6 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            {showAll ? (
              <>
                Show Less
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show {materials.length - 6} More
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

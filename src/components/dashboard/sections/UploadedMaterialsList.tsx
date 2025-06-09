
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
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-green-500" />;
    if (fileType?.includes('video')) return <Video className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes('audio')) return <Music className="w-5 h-5 text-purple-500" />;
    return <Archive className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const displayedMaterials = showAll ? materials : materials.slice(0, 3);

  if (loading) {
    return (
      <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
            📚 Your Study Materials
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

  if (materials.length === 0) {
    return (
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
            📚 Your Study Materials
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm mb-4">No materials uploaded yet</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSectionChange?.('upload')}
            >
              Upload Materials
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
          📚 Your Study Materials
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3">
          {displayedMaterials.map((material) => (
            <div
              key={material.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {getFileIcon(material.file_type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 truncate text-sm">
                  {material.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{material.course}</span>
                  <span>•</span>
                  <span>{formatFileSize(material.file_size)}</span>
                  {material.processed && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        ✓ Processed
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="View material"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {material.processed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Study flashcards"
                    onClick={() => onSectionChange?.('flashcards')}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {materials.length > 3 && (
          <div className="pt-4 border-t border-gray-100 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  Show Less
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show {materials.length - 3} More
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

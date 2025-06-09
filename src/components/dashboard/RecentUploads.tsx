
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface Upload {
  id: string;
  name: string;
  material_type: string;
  course: string;
  upload_date: string;
  processed: boolean;
  file_type: string;
  extraction_method?: string;
  extraction_confidence?: number;
}

export function RecentUploads() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRecentUploads();
    }
  }, [user]);

  const fetchRecentUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('cramintel_materials')
        .select('id, name, material_type, course, upload_date, processed, file_type, extraction_method, extraction_confidence')
        .eq('user_id', user?.id)
        .order('upload_date', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching uploads:', error);
        return;
      }

      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
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

  const getProcessingBadge = (upload: Upload) => {
    if (!upload.processed) {
      return (
        <span className="text-[10px] sm:text-xs text-gray-600 px-2 md:px-3 py-1 md:py-2 bg-gray-100 rounded-lg">
          Processing...
        </span>
      );
    }

    if (upload.extraction_method) {
      const method = upload.extraction_method;
      const confidence = upload.extraction_confidence || 0;
      
      let badgeColor = 'bg-green-100 text-green-700';
      if (confidence < 70) badgeColor = 'bg-yellow-100 text-yellow-700';
      if (confidence < 50) badgeColor = 'bg-red-100 text-red-700';

      return (
        <span className={`text-[10px] sm:text-xs px-2 md:px-3 py-1 md:py-2 rounded-lg ${badgeColor}`}>
          {method} ({confidence}%)
        </span>
      );
    }

    return (
      <span className="text-[10px] sm:text-xs text-green-600 px-2 md:px-3 py-1 md:py-2 bg-green-100 rounded-lg">
        Processed
      </span>
    );
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
      <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
            📂 Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 md:p-4 border border-gray-100 rounded-xl">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-gray-800 font-space text-lg sm:text-xl">
          📂 Recent Uploads
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3 md:space-y-4">
          {uploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No uploads yet. Start by uploading some study materials!</p>
            </div>
          ) : (
            uploads.map((upload) => (
              <div key={upload.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-300 gap-3">
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <span className="text-xl md:text-2xl">{getIcon(upload.material_type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs sm:text-sm text-gray-800 truncate">{upload.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">
                      {upload.course} • {formatTimeAgo(upload.upload_date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto items-center">
                  {upload.processed ? (
                    <>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-xs flex-1 sm:flex-none">
                        Ask AI
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-xs flex-1 sm:flex-none">
                        View Flashcards
                      </Button>
                    </>
                  ) : null}
                  {getProcessingBadge(upload)}
                </div>
              </div>
            ))
          )}
        </div>
        
        <Button variant="outline" className="w-full mt-4 md:mt-6 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
          View All Uploads
        </Button>
      </CardContent>
    </Card>
  );
}

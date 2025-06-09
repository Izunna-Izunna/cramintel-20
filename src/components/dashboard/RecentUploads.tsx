
import React, { useState } from 'react';
import { UploadedMaterialsList } from './sections/UploadedMaterialsList';

interface RecentUploadsProps {
  onSectionChange?: (section: string) => void;
}

export function RecentUploads({ onSectionChange }: RecentUploadsProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <UploadedMaterialsList 
      key={refreshKey}
      onSectionChange={onSectionChange}
    />
  );
}

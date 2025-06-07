
export const isImageFile = (fileType: string, fileName?: string): boolean => {
  // Check MIME type first
  if (fileType) {
    const imageMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'image/ico'
    ];
    
    if (imageMimeTypes.includes(fileType.toLowerCase())) {
      return true;
    }
  }
  
  // Fallback to file extension check
  if (fileName) {
    const imageExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', 
      '.svg', '.bmp', '.tiff', '.ico'
    ];
    
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }
  
  return false;
};

export const isPdfFile = (fileType: string): boolean => {
  return fileType === 'application/pdf';
};

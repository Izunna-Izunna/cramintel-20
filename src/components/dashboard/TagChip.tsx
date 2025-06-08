
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagChipProps {
  label: string;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'gray';
  removable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function TagChip({ 
  label, 
  color = 'gray', 
  removable = false, 
  disabled = false,
  onClick, 
  onRemove 
}: TagChipProps) {
  const colorVariants = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onRemove) {
      onRemove();
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors',
        colorVariants[color],
        onClick && !disabled && 'cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={handleClick}
    >
      {label}
      {removable && !disabled && (
        <button
          onClick={handleRemove}
          className="ml-1 hover:bg-white hover:bg-opacity-50 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

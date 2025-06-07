
import React from 'react';
import { X } from 'lucide-react';

interface TagChipProps {
  label: string;
  color?: 'default' | 'blue' | 'green' | 'purple' | 'orange';
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

export function TagChip({ label, color = 'default', removable = false, onRemove, onClick }: TagChipProps) {
  const colorClasses = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    green: 'bg-green-100 text-green-700 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200'
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${colorClasses[color]}`}
      onClick={onClick}
    >
      {label}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

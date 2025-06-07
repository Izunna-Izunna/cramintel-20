import React from 'react';
import { cn } from '@/lib/utils';

interface CramIntelLogoProps {
  variant?: 'primary' | 'light' | 'dark' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CramIntelLogo: React.FC<CramIntelLogoProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-18 w-auto',
    md: 'h-24 w-auto',
    lg: 'h-30 w-auto'
  };

  const gradientId = `cramintel-gradient-${variant}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Define colors based on variant
  const getColors = () => {
    switch (variant) {
      case 'light':
        return {
          brain: '#FFFFFF',
          lightning: '#60A5FA',
          text: '#FFFFFF',
          gradientStart: '#374151',
          gradientEnd: '#9CA3AF'
        };
      case 'dark':
        return {
          brain: '#1F2937',
          lightning: '#3B82F6',
          text: '#1F2937',
          gradientStart: '#374151',
          gradientEnd: '#9CA3AF'
        };
      case 'icon-only':
        return {
          brain: '#1F2937',
          lightning: '#3B82F6',
          text: '#1F2937',
          gradientStart: '#374151',
          gradientEnd: '#9CA3AF'
        };
      default: // primary
        return {
          brain: '#1F2937',
          lightning: '#3B82F6',
          text: '#1F2937',
          gradientStart: '#374151',
          gradientEnd: '#9CA3AF'
        };
    }
  };

  const colors = getColors();

  return (
    <div className={cn(sizeClasses[size], className)}>
      <svg
        viewBox="0 0 200 50"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.gradientStart} />
            <stop offset="100%" stopColor={colors.gradientEnd} />
          </linearGradient>
        </defs>
        
        {/* Background gradient (only for primary variant) */}
        {variant === 'primary' && (
          <rect width="200" height="50" rx="8" fill={`url(#${gradientId})`} />
        )}
        
        {/* Brain icon */}
        <g transform="translate(8, 8)">
          {/* Brain outline */}
          <path
            d="M17 8C17 6 15.5 4 13 4C11.5 4 10 5 9.5 6.5C8.5 5.5 7 5 5.5 5C3 5 1 7 1 9.5C1 10.5 1.5 11.5 2 12C1.5 13 1 14.5 1 16C1 19 3.5 21.5 6.5 21.5C7.5 21.5 8.5 21 9.5 20.5C10.5 21.5 12 22 13.5 22C16.5 22 19 19.5 19 16.5C19 15.5 18.5 14.5 18 13.5C18.5 12.5 19 11 19 9.5C19 8.5 18 8 17 8Z"
            fill={colors.brain}
            stroke={colors.brain}
            strokeWidth="0.5"
          />
          
          {/* Brain details/neural pathways */}
          <path
            d="M6 9C6.5 9.5 7 10 7.5 10.5M12 9C12.5 9.5 13 10 13.5 10.5M6 14C6.5 14.5 7 15 7.5 15.5M12 14C12.5 14.5 13 15 13.5 15.5M10 11L10 17"
            stroke={colors.lightning}
            strokeWidth="0.8"
            opacity="0.6"
          />
          
          {/* Lightning bolt in center */}
          <path
            d="M12 7L8 13H11L9 19L13 13H10L12 7Z"
            fill={colors.lightning}
            stroke="none"
          />
        </g>
        
        {/* CramIntel text (hidden for icon-only variant) */}
        {variant !== 'icon-only' && (
          <g transform="translate(50, 12)">
            <text
              x="0"
              y="12"
              fontFamily="Inter, sans-serif"
              fontSize="14"
              fontWeight="700"
              fill={colors.text}
            >
              CramIntel
            </text>
            <text
              x="0"
              y="28"
              fontFamily="Inter, sans-serif"
              fontSize="8"
              fontWeight="400"
              fill={colors.text}
              opacity="0.8"
            >
              Smart Learning AI
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default CramIntelLogo;

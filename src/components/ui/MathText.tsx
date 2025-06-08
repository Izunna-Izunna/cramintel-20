
import React from 'react';
import { MathFormula } from './MathFormula';
import { parseMathContent } from '@/utils/mathParser';

interface MathTextProps {
  children: string;
  className?: string;
}

export function MathText({ children, className = '' }: MathTextProps) {
  const segments = parseMathContent(children);
  
  return (
    <div className={className}>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'block-math':
            return (
              <div key={index} className="my-4">
                <MathFormula block={true}>{segment.content}</MathFormula>
              </div>
            );
          case 'inline-math':
            return (
              <span key={index}>
                <MathFormula>{segment.content}</MathFormula>
              </span>
            );
          case 'text':
          default:
            return <span key={index}>{segment.content}</span>;
        }
      })}
    </div>
  );
}


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
              <div key={index} className="my-4 flex justify-center">
                <MathFormula block={true}>{segment.content}</MathFormula>
              </div>
            );
          case 'inline-math':
            return (
              <span key={index} className="inline-flex items-center">
                <MathFormula>{segment.content}</MathFormula>
              </span>
            );
          case 'text':
          default:
            // Split by newlines and render each line properly
            const lines = segment.content.split('\n');
            return (
              <span key={index}>
                {lines.map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {line}
                    {lineIndex < lines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </span>
            );
        }
      })}
    </div>
  );
}

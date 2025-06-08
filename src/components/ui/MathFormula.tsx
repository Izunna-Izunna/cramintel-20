
import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathFormulaProps {
  children: string;
  block?: boolean;
}

export function MathFormula({ children, block = false }: MathFormulaProps) {
  // Clean the LaTeX content more thoroughly
  const cleanedContent = children
    .replace(/\\,/g, ' ') // Replace \, with space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  try {
    if (block) {
      return (
        <div className="my-4 flex justify-center">
          <BlockMath 
            math={cleanedContent}
            settings={{
              throwOnError: false,
              displayMode: true,
              colorIsTextColor: true,
              strict: false,
              trust: true
            }}
          />
        </div>
      );
    } else {
      return (
        <span className="inline-flex items-center mx-1">
          <InlineMath 
            math={cleanedContent}
            settings={{
              throwOnError: false,
              colorIsTextColor: true,
              strict: false,
              trust: true
            }}
          />
        </span>
      );
    }
  } catch (error) {
    console.warn('Failed to render LaTeX:', cleanedContent, error);
    // Fallback to plain text if LaTeX parsing fails
    return (
      <span className={`font-mono text-red-600 ${block ? 'block my-2' : 'inline'}`}>
        {cleanedContent}
      </span>
    );
  }
}

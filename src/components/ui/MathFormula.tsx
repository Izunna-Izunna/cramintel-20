
import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathFormulaProps {
  children: string;
  block?: boolean;
}

export function MathFormula({ children, block = false }: MathFormulaProps) {
  try {
    if (block) {
      return <BlockMath math={children} />;
    } else {
      return <InlineMath math={children} />;
    }
  } catch (error) {
    console.warn('Failed to render LaTeX:', children, error);
    // Fallback to plain text if LaTeX parsing fails
    return <span className="font-mono text-red-600">{children}</span>;
  }
}

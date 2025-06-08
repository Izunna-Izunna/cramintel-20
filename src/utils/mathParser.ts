
export interface TextSegment {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
}

export function parseMathContent(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentIndex = 0;
  
  // Regular expressions for different math patterns
  const blockMathRegex = /\$\$(.*?)\$\$/g;
  const inlineMathRegex = /\$(.*?)\$/g;
  
  // First, find all block math expressions
  const blockMatches = Array.from(text.matchAll(blockMathRegex));
  
  // Then find inline math expressions (excluding those inside block math)
  let textWithoutBlocks = text;
  const blockRanges: Array<{start: number, end: number}> = [];
  
  blockMatches.forEach(match => {
    if (match.index !== undefined) {
      blockRanges.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
  });
  
  // Process the text segment by segment
  const allMatches = [
    ...blockMatches.map(m => ({ ...m, type: 'block' as const })),
    ...Array.from(text.matchAll(inlineMathRegex))
      .filter(m => {
        // Exclude inline matches that are inside block math
        if (m.index === undefined) return false;
        return !blockRanges.some(range => 
          m.index! >= range.start && m.index! < range.end
        );
      })
      .map(m => ({ ...m, type: 'inline' as const }))
  ].sort((a, b) => (a.index || 0) - (b.index || 0));
  
  allMatches.forEach(match => {
    if (match.index === undefined) return;
    
    // Add text before the math expression
    if (match.index > currentIndex) {
      const textContent = text.slice(currentIndex, match.index);
      if (textContent.trim()) {
        segments.push({
          type: 'text',
          content: textContent
        });
      }
    }
    
    // Add the math expression
    segments.push({
      type: match.type === 'block' ? 'block-math' : 'inline-math',
      content: match[1] // The content inside the $ delimiters
    });
    
    currentIndex = match.index + match[0].length;
  });
  
  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText.trim()) {
      segments.push({
        type: 'text',
        content: remainingText
      });
    }
  }
  
  // If no math expressions found, return the entire text as one segment
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: text
    });
  }
  
  return segments;
}

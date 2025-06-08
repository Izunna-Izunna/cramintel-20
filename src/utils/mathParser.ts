
export interface TextSegment {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
}

export function parseMathContent(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentIndex = 0;
  
  // Enhanced regular expressions for different math patterns
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineMathRegex = /\$((?:[^$\\]|\\.)*)?\$/g;
  const altBlockMathRegex = /\\\[([\s\S]*?)\\\]/g;
  const altInlineMathRegex = /\\\(((?:[^\\]|\\.)*)?\\\)/g;
  
  // Collect all math expressions with their positions
  const allMatches: Array<{
    match: RegExpExecArray;
    type: 'block' | 'inline';
    content: string;
  }> = [];

  // Find block math expressions (highest priority)
  let match;
  while ((match = blockMathRegex.exec(text)) !== null) {
    allMatches.push({
      match,
      type: 'block',
      content: match[1]?.trim() || ''
    });
  }

  // Find alternative block math \[...\]
  while ((match = altBlockMathRegex.exec(text)) !== null) {
    allMatches.push({
      match,
      type: 'block',
      content: match[1]?.trim() || ''
    });
  }

  // Find inline math expressions, but exclude those inside block math
  const blockRanges = allMatches
    .filter(m => m.type === 'block')
    .map(m => ({
      start: m.match.index!,
      end: m.match.index! + m.match[0].length
    }));

  // Reset regex
  inlineMathRegex.lastIndex = 0;
  while ((match = inlineMathRegex.exec(text)) !== null) {
    const isInsideBlock = blockRanges.some(range => 
      match.index! >= range.start && match.index! < range.end
    );
    
    if (!isInsideBlock && match[1]) {
      allMatches.push({
        match,
        type: 'inline',
        content: match[1].trim()
      });
    }
  }

  // Find alternative inline math \(...\)
  altInlineMathRegex.lastIndex = 0;
  while ((match = altInlineMathRegex.exec(text)) !== null) {
    const isInsideBlock = blockRanges.some(range => 
      match.index! >= range.start && match.index! < range.end
    );
    
    if (!isInsideBlock && match[1]) {
      allMatches.push({
        match,
        type: 'inline',
        content: match[1].trim()
      });
    }
  }

  // Sort matches by position
  allMatches.sort((a, b) => a.match.index! - b.match.index!);

  // Process segments
  allMatches.forEach(({ match, type, content }) => {
    if (match.index === undefined) return;
    
    // Add text before the math expression
    if (match.index > currentIndex) {
      const textContent = text.slice(currentIndex, match.index);
      if (textContent.trim() || textContent.includes('\n')) {
        segments.push({
          type: 'text',
          content: textContent
        });
      }
    }
    
    // Add the math expression
    if (content) {
      segments.push({
        type: type === 'block' ? 'block-math' : 'inline-math',
        content: content
      });
    }
    
    currentIndex = match.index + match[0].length;
  });
  
  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText.trim() || remainingText.includes('\n')) {
      segments.push({
        type: 'text',
        content: remainingText
      });
    }
  }
  
  // If no math expressions found, return the entire text as one segment
  if (segments.length === 0 && text.trim()) {
    segments.push({
      type: 'text',
      content: text
    });
  }
  
  return segments;
}

export interface TextSegment {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
}

export function parseMathContent(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentIndex = 0;
  
  // Enhanced regular expressions for different math patterns
  // Order matters - we need to process block math first to avoid conflicts
  const patterns = [
    // Block math patterns (process first)
    { regex: /\\\[([\s\S]*?)\\\]/g, type: 'block' as const },
    { regex: /\$\$([\s\S]*?)\$\$/g, type: 'block' as const },
    // Inline math patterns
    { regex: /\\\(((?:[^\\]|\\[^)])*?)\\\)/g, type: 'inline' as const },
    { regex: /\$([^$\n]+?)\$/g, type: 'inline' as const }
  ];
  
  // Collect all math expressions with their positions
  const allMatches: Array<{
    start: number;
    end: number;
    content: string;
    type: 'block' | 'inline';
  }> = [];

  // Find all math expressions
  patterns.forEach(pattern => {
    let match;
    pattern.regex.lastIndex = 0; // Reset regex
    
    while ((match = pattern.regex.exec(text)) !== null) {
      if (match.index !== undefined && match[1]) {
        const content = match[1].trim();
        if (content) {
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            content: content,
            type: pattern.type
          });
        }
      }
    }
  });

  // Sort matches by position and remove overlaps
  allMatches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (keep the first one found)
  const filteredMatches = [];
  for (const match of allMatches) {
    const hasOverlap = filteredMatches.some(existing => 
      (match.start >= existing.start && match.start < existing.end) ||
      (match.end > existing.start && match.end <= existing.end) ||
      (match.start <= existing.start && match.end >= existing.end)
    );
    
    if (!hasOverlap) {
      filteredMatches.push(match);
    }
  }

  // Process segments
  filteredMatches.forEach(match => {
    // Add text before the math expression
    if (match.start > currentIndex) {
      const textContent = text.slice(currentIndex, match.start);
      if (textContent.trim() || textContent.includes('\n')) {
        segments.push({
          type: 'text',
          content: textContent
        });
      }
    }
    
    // Add the math expression
    segments.push({
      type: match.type === 'block' ? 'block-math' : 'inline-math',
      content: match.content
    });
    
    currentIndex = match.end;
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

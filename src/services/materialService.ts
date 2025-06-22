
import { supabase } from '@/integrations/supabase/client';

// Updated MaterialData interface to match actual database schema
export interface MaterialData {
  id: string;
  name: string;
  course: string;
  material_type: string;
  file_name: string;
  file_type: string;
  file_size: number;
  processed: boolean;
  upload_date: string;
  file_path?: string;
  group_id?: string;
  group_name?: string;
  user_id: string;
}

// Separate interface for extracted text data
export interface ExtractedTextData {
  id: string;
  material_id: string;
  extracted_text: string;
  extraction_method: string;
  extraction_confidence: number;
  word_count: number;
  character_count: number;
}

export interface Chapter {
  number: number;
  title: string;
  startPage?: number;
  content?: string;
}

// Utility function to safely convert Json to string
export function jsonToString(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  return JSON.stringify(value);
}

export class MaterialService {
  
  // Fetch material data by material_id
  static async getMaterialById(materialId: string): Promise<MaterialData | null> {
    try {
      const { data, error } = await supabase
        .from('cramintel_materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (error) {
        console.error('Error fetching material:', error);
        return null;
      }

      // Convert to unknown first, then to MaterialData to avoid type errors
      return data as unknown as MaterialData;
    } catch (error) {
      console.error('Error in getMaterialById:', error);
      return null;
    }
  }

  // Fetch extracted text for a material
  static async getExtractedText(materialId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('cramintel_extracted_texts')
        .select('extracted_text')
        .eq('material_id', materialId)
        .single();

      if (error || !data) {
        console.error('Error fetching extracted text:', error);
        return '';
      }

      return data.extracted_text || '';
    } catch (error) {
      console.error('Error in getExtractedText:', error);
      return '';
    }
  }

  // Extract chapters from the document text
  static extractChapters(extractedText: string): Chapter[] {
    const chapters: Chapter[] = [];
    
    // Multiple regex patterns to catch different chapter formats
    const chapterPatterns = [
      /^CHAPTER\s+(\d+)[\s\-:]*(.+?)$/gim,
      /^Chapter\s+(\d+)[\s\-:]*(.+?)$/gim,
      /^(\d+)\.\s*(.+?)$/gm,
      /^UNIT\s+(\d+)[\s\-:]*(.+?)$/gim,
      /^Unit\s+(\d+)[\s\-:]*(.+?)$/gim,
      /^SECTION\s+(\d+)[\s\-:]*(.+?)$/gim,
      /^Section\s+(\d+)[\s\-:]*(.+?)$/gim,
    ];

    // Try each pattern
    for (const pattern of chapterPatterns) {
      const matches = extractedText.matchAll(pattern);
      
      for (const match of matches) {
        const chapterNum = parseInt(match[1]);
        const title = match[2]?.trim();
        
        if (title && title.length > 0 && title.length < 200) {
          chapters.push({
            number: chapterNum,
            title: title,
            content: match[0]
          });
        }
      }
      
      // If we found chapters with this pattern, break
      if (chapters.length > 0) break;
    }

    // Remove duplicates and sort by chapter number
    const uniqueChapters = chapters.filter((chapter, index, self) => 
      index === self.findIndex(c => c.number === chapter.number)
    );

    return uniqueChapters.sort((a, b) => a.number - b.number);
  }

  // Enhanced chapter extraction with context analysis
  static extractChaptersAdvanced(extractedText: string): Chapter[] {
    const lines = extractedText.split('\n');
    const chapters: Chapter[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for chapter indicators
      if (this.isChapterLine(line)) {
        const chapter = this.parseChapterLine(line);
        if (chapter) {
          // Try to find the start page if mentioned
          const nextFewLines = lines.slice(i + 1, i + 5).join(' ');
          const pageMatch = nextFewLines.match(/page\s+(\d+)/i);
          
          if (pageMatch) {
            chapter.startPage = parseInt(pageMatch[1]);
          }
          
          chapters.push(chapter);
        }
      }
    }

    return chapters.sort((a, b) => a.number - b.number);
  }

  private static isChapterLine(line: string): boolean {
    const chapterIndicators = [
      /^CHAPTER\s+\d+/i,
      /^Chapter\s+\d+/i,
      /^\d+\.\s+[A-Z]/,
      /^UNIT\s+\d+/i,
      /^Unit\s+\d+/i,
      /^SECTION\s+\d+/i,
      /^Section\s+\d+/i,
    ];
    
    return chapterIndicators.some(pattern => pattern.test(line));
  }

  private static parseChapterLine(line: string): Chapter | null {
    const patterns = [
      /^CHAPTER\s+(\d+)[\s\-:]*(.+?)$/i,
      /^Chapter\s+(\d+)[\s\-:]*(.+?)$/i,
      /^(\d+)\.\s*(.+?)$/,
      /^UNIT\s+(\d+)[\s\-:]*(.+?)$/i,
      /^Unit\s+(\d+)[\s\-:]*(.+?)$/i,
      /^SECTION\s+(\d+)[\s\-:]*(.+?)$/i,
      /^Section\s+(\d+)[\s\-:]*(.+?)$/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          number: parseInt(match[1]),
          title: match[2]?.trim() || `Chapter ${match[1]}`,
          content: line
        };
      }
    }

    return null;
  }
}

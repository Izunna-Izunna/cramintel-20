
import { MaterialService, Chapter, jsonToString } from './materialService';

export class AIService {
  
  static async listChaptersFromMaterial(materialId: string): Promise<{
    success: boolean;
    chapters: Chapter[];
    message: string;
  }> {
    try {
      // Fetch material data
      const material = await MaterialService.getMaterialById(materialId);
      
      if (!material) {
        return {
          success: false,
          chapters: [],
          message: "Material not found or couldn't be loaded."
        };
      }

      // Fetch extracted text separately
      const extractedText = await MaterialService.getExtractedText(materialId);

      if (!extractedText) {
        return {
          success: false,
          chapters: [],
          message: "No extracted text available for this material."
        };
      }

      // Extract chapters using both methods
      const basicChapters = MaterialService.extractChapters(extractedText);
      const advancedChapters = MaterialService.extractChaptersAdvanced(extractedText);
      
      // Use the method that found more chapters
      const chapters = advancedChapters.length > basicChapters.length 
        ? advancedChapters 
        : basicChapters;

      if (chapters.length === 0) {
        return {
          success: false,
          chapters: [],
          message: "No chapters could be identified in this document. The document might not follow a standard chapter structure."
        };
      }

      return {
        success: true,
        chapters,
        message: `Found ${chapters.length} chapters in the document.`
      };

    } catch (error) {
      console.error('Error in listChaptersFromMaterial:', error);
      return {
        success: false,
        chapters: [],
        message: "An error occurred while processing the document."
      };
    }
  }

  // Format chapters for display in chat
  static formatChaptersForChat(chapters: Chapter[]): string {
    if (chapters.length === 0) {
      return "No chapters found in this document.";
    }

    let response = `📚 **Document Chapters** (${chapters.length} found)\n\n`;
    
    chapters.forEach((chapter, index) => {
      response += `**${chapter.number}.** ${chapter.title}`;
      if (chapter.startPage) {
        response += ` (Page ${chapter.startPage})`;
      }
      response += '\n';
    });
    
    response += '\n💡 *Would you like me to explain any specific chapter or help you with questions about the content?*';
    
    return response;
  }
}


export interface ContentAnalysis {
  topics: string[];
  keyTerms: string[];
  questionPatterns: string[];
  lecturerStyle: string[];
  confidence: number;
  summary: string;
}

export interface MaterialSummary {
  type: 'notes' | 'past-question' | 'assignment' | 'whisper';
  content: string;
  topics: string[];
  importance: number;
  patterns: string[];
}

export class ContentAnalyzer {
  static analyzeText(text: string, materialType: string): ContentAnalysis {
    const topics = this.extractTopics(text);
    const keyTerms = this.extractKeyTerms(text);
    const questionPatterns = this.extractQuestionPatterns(text, materialType);
    const lecturerStyle = this.extractLecturerStyle(text);
    
    return {
      topics,
      keyTerms,
      questionPatterns,
      lecturerStyle,
      confidence: this.calculateConfidence(text, materialType),
      summary: this.generateSummary(text, topics)
    };
  }

  static extractTopics(text: string): string[] {
    // Extract chapter titles, section headers, and key concepts
    const topicPatterns = [
      /chapter\s+\d+[:\-\s]+([^.\n]+)/gi,
      /section\s+\d+[:\-\s]+([^.\n]+)/gi,
      /topic[:\-\s]+([^.\n]+)/gi,
      /\d+\.\s+([A-Z][^.\n]{10,50})/g,
      /^([A-Z][A-Z\s]{5,30})$/gm
    ];

    const topics = new Set<string>();
    
    topicPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/^(chapter|section|topic)\s*\d*[:\-\s]*/i, '').trim();
          if (cleaned.length > 3 && cleaned.length < 100) {
            topics.add(cleaned);
          }
        });
      }
    });

    return Array.from(topics).slice(0, 15);
  }

  static extractKeyTerms(text: string): string[] {
    // Extract technical terms, definitions, and important concepts
    const termPatterns = [
      /definition[:\-\s]+([^.\n]+)/gi,
      /theorem[:\-\s]+([^.\n]+)/gi,
      /principle[:\-\s]+([^.\n]+)/gi,
      /law\s+of\s+([^.\n]+)/gi,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+(?:is|are|refers|means)/g
    ];

    const terms = new Set<string>();
    
    termPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/^(definition|theorem|principle|law\s+of)[:\-\s]*/i, '').trim();
          if (cleaned.length > 3 && cleaned.length < 50) {
            terms.add(cleaned);
          }
        });
      }
    });

    return Array.from(terms).slice(0, 20);
  }

  static extractQuestionPatterns(text: string, materialType: string): string[] {
    if (materialType !== 'past-question') return [];

    const patterns = [
      /\d+\.\s+([^?\n]*\?)/g,
      /question\s+\d+[:\-\s]+([^.\n]+)/gi,
      /(define|explain|derive|calculate|find|determine)\s+([^.\n]+)/gi,
      /(what|why|how|when|where)\s+([^?\n]*\?)/gi
    ];

    const questions = new Set<string>();
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim();
          if (cleaned.length > 10 && cleaned.length < 200) {
            questions.add(cleaned);
          }
        });
      }
    });

    return Array.from(questions).slice(0, 10);
  }

  static extractLecturerStyle(text: string): string[] {
    const stylePatterns = [
      /(professor|lecturer|dr\.?)\s+([^.\n]+)/gi,
      /(emphasized|stressed|mentioned|noted)\s+([^.\n]+)/gi,
      /(important|crucial|key|essential)\s+([^.\n]+)/gi,
      /(will\s+come\s+out|expect|likely|probably)\s+([^.\n]+)/gi
    ];

    const styles = new Set<string>();
    
    stylePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim();
          if (cleaned.length > 5 && cleaned.length < 100) {
            styles.add(cleaned);
          }
        });
      }
    });

    return Array.from(styles).slice(0, 8);
  }

  static calculateConfidence(text: string, materialType: string): number {
    let confidence = 50; // Base confidence

    // Length factor
    if (text.length > 5000) confidence += 20;
    else if (text.length > 2000) confidence += 10;
    else if (text.length < 500) confidence -= 15;

    // Material type factor
    switch (materialType) {
      case 'past-question':
        confidence += 25;
        break;
      case 'assignment':
        confidence += 20;
        break;
      case 'notes':
        confidence += 10;
        break;
      case 'whisper':
        confidence += 5;
        break;
    }

    // Structure indicators
    if (text.includes('question') || text.includes('Q:')) confidence += 15;
    if (text.includes('chapter') || text.includes('section')) confidence += 10;
    if (text.includes('definition') || text.includes('theorem')) confidence += 10;

    return Math.min(95, Math.max(20, confidence));
  }

  static generateSummary(text: string, topics: string[]): string {
    const firstSentences = text.split('.').slice(0, 3).join('.').substring(0, 200);
    const topicList = topics.slice(0, 5).join(', ');
    
    return `${firstSentences}... Key topics: ${topicList}`;
  }

  static summarizeMaterials(materials: any[]): MaterialSummary[] {
    return materials.map(material => {
      const analysis = this.analyzeText(material.content || '', material.type);
      
      return {
        type: material.type,
        content: analysis.summary,
        topics: analysis.topics,
        importance: this.calculateImportance(material.type, analysis.confidence),
        patterns: analysis.questionPatterns
      };
    });
  }

  static calculateImportance(type: string, confidence: number): number {
    const typeWeights = {
      'past-question': 0.4,
      'assignment': 0.3,
      'notes': 0.2,
      'whisper': 0.1
    };

    return (typeWeights[type as keyof typeof typeWeights] || 0.1) * (confidence / 100);
  }
}


import { ContentAnalyzer, MaterialSummary } from './contentAnalyzer';

export interface ExamContext {
  course: string;
  topics: string[];
  lecturer?: string;
  university?: string;
  level?: string;
  department?: string;
}

export interface PredictionStyle {
  format: 'bullet' | 'theory' | 'mixed' | 'exam-paper';
  questionCount: number;
  includeCalculations: boolean;
  academicLevel: 'undergraduate' | 'postgraduate';
}

export class ExamPromptBuilder {
  static buildAdvancedPrompt(
    materials: MaterialSummary[],
    context: ExamContext,
    style: PredictionStyle,
    whispers: string[] = []
  ): string {
    const prompt = `You are an expert AI exam prediction assistant trained on West African university examination patterns and academic standards.

CONTEXT:
Course: ${context.course}
${context.university ? `University: ${context.university}` : ''}
${context.department ? `Department: ${context.department}` : ''}
${context.level ? `Level: ${context.level}` : ''}
${context.lecturer ? `Lecturer Style: ${context.lecturer}` : ''}

PREDICTION TASK:
Generate realistic exam questions based on the uploaded materials. Your predictions should feel authentic, academically rigorous, and match typical university examination standards.

MATERIAL ANALYSIS:
${this.formatMaterialAnalysis(materials)}

STUDENT INTELLIGENCE (Whispers):
${whispers.length > 0 ? whispers.map(w => `• ${w}`).join('\n') : 'No additional hints provided'}

EXAM FORMAT REQUIREMENTS:
${this.formatStyleRequirements(style)}

AI INSTRUCTIONS:
1. Generate questions that sound like real lecturers wrote them
2. Use proper academic language and terminology
3. Include a mix of theoretical concepts and practical applications
4. Reference specific topics covered in the materials
5. Maintain appropriate difficulty level for ${style.academicLevel} students
6. Include confidence scores for each prediction (85-95% for high confidence)

${style.format === 'exam-paper' ? this.getExamPaperFormat(context) : this.getBulletFormat()}

CRITICAL: Respond ONLY with the exam content. No explanations, introductions, or meta-commentary.`;

    return prompt;
  }

  static formatMaterialAnalysis(materials: MaterialSummary[]): string {
    return materials.map((material, index) => {
      return `Material ${index + 1} (${material.type.toUpperCase()}):
Topics: ${material.topics.join(', ')}
Importance Weight: ${(material.importance * 100).toFixed(0)}%
Key Patterns: ${material.patterns.slice(0, 3).join('; ')}
Content Summary: ${material.content}`;
    }).join('\n\n');
  }

  static formatStyleRequirements(style: PredictionStyle): string {
    const requirements = [
      `Format: ${style.format.toUpperCase()}`,
      `Question Count: ${style.questionCount}`,
      `Include Calculations: ${style.includeCalculations ? 'YES' : 'NO'}`,
      `Academic Level: ${style.academicLevel.toUpperCase()}`
    ];

    return requirements.join('\n');
  }

  static getExamPaperFormat(context: ExamContext): string {
    return `
OUTPUT FORMAT (EXAM PAPER):
Generate a complete, realistic exam paper with this structure:

[UNIVERSITY HEADER]
${context.university || 'UNIVERSITY'}
${context.department ? `Department of ${context.department}` : ''}
${context.course}
Time Allowed: 2-3 hours
Instructions: Answer ALL questions in Section A, and ANY TWO questions in Section B

SECTION A - COMPULSORY (Answer All Questions)
1. [Question requiring definitions/short explanations]
2. [Question on basic concepts]
3. [Question on applications/examples]

SECTION B - ANSWER ANY TWO
4. [Complex theoretical question]
5. [Problem-solving/calculation question]
6. [Analysis/evaluation question]

[Mark allocations should total 100]`;
  }

  static getBulletFormat(): string {
    return `
OUTPUT FORMAT (BULLET PREDICTIONS):
• [Question 1] - Confidence: XX% - Source: [Material type]
• [Question 2] - Confidence: XX% - Source: [Material type]
• [Question 3] - Confidence: XX% - Source: [Material type]

Include reasoning for each prediction in 1-2 sentences.`;
  }

  static enhanceWithLecturerStyle(prompt: string, lecturerHints: string[]): string {
    if (lecturerHints.length === 0) return prompt;

    const styleSection = `
LECTURER BEHAVIORAL PATTERNS:
${lecturerHints.map(hint => `• ${hint}`).join('\n')}

Adjust question style and topics based on these lecturer preferences and emphasis patterns.`;

    return prompt.replace('AI INSTRUCTIONS:', styleSection + '\n\nAI INSTRUCTIONS:');
  }

  static addPatternWeighting(prompt: string, pastQuestions: string[]): string {
    if (pastQuestions.length === 0) return prompt;

    const patternSection = `
PAST QUESTION PATTERNS DETECTED:
${pastQuestions.slice(0, 8).map((q, i) => `${i + 1}. ${q}`).join('\n')}

Weight your predictions toward similar question structures and phrasing patterns.`;

    return prompt.replace('CRITICAL:', patternSection + '\n\nCRITICAL:');
  }
}

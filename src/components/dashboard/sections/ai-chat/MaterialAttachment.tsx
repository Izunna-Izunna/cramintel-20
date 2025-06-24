
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Paperclip, X, FileText, Image, Upload, Search, Loader2, AlertCircle } from 'lucide-react';
import { Material, useMaterials } from '@/hooks/useMaterials';
import { supabase } from '@/integrations/supabase/client';
import { jsonToString } from '@/services/materialService';
import { useToast } from '@/hooks/use-toast';

interface AttachedMaterial {
  id: string;
  name: string;
  type: 'material' | 'upload';
  content?: string;
}

interface MaterialAttachmentProps {
  attachedMaterials: AttachedMaterial[];
  onAttach: (materials: AttachedMaterial[]) => void;
  onDetach: (materialId: string) => void;
}

// Simplified interfaces to avoid deep type instantiation
interface SimpleFlashcard {
  question: string;
  answer: string;
  difficulty_level: string | null;
  course: string | null;
}

interface SimpleExtractedText {
  extracted_text: string;
  word_count: number | null;
  extraction_confidence: number | null;
}

export function MaterialAttachment({ attachedMaterials, onAttach, onDetach }: MaterialAttachmentProps) {
  const [showMaterialBrowser, setShowMaterialBrowser] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState<Set<string>>(new Set());
  const [extractionErrors, setExtractionErrors] = useState<Set<string>>(new Set());
  const { materials, loading } = useMaterials();
  const { toast } = useToast();

  const extractPDFContent = async (material: Material): Promise<string> => {
    try {
      console.log(`Extracting content for material: ${material.name}`);
      
      // Clear any previous extraction errors for this material
      setExtractionErrors(prev => {
        const newSet = new Set(prev);
        newSet.delete(material.id);
        return newSet;
      });
      
      // FIXED: Completely bypass Supabase type inference by using the client directly
      const flashcardQuery = supabase
        .from('cramintel_flashcards')
        .select('question, answer, difficulty_level, course')
        .eq('material_id', material.id)
        .order('created_at', { ascending: true });

      // Execute query and cast result to bypass type inference
      const flashcardResult: any = await flashcardQuery;
      const flashcardsData = flashcardResult.data;
      const flashcardError = flashcardResult.error;

      if (flashcardError) {
        console.error('Error fetching flashcards:', flashcardError);
        throw new Error(`Failed to fetch flashcards: ${flashcardError.message}`);
      }

      let content = `📚 STUDY MATERIAL: ${material.name}
🎓 Course: ${material.course || 'General Studies'}  
📁 Type: ${material.material_type || 'Document'}
📄 File: ${material.file_name}
📅 Uploaded: ${new Date(material.upload_date).toLocaleDateString()}
✅ Processing Status: ${material.processed ? 'Fully Processed' : 'Processing...'}

`;

      if (!flashcardError && flashcardsData && flashcardsData.length > 0) {
        // Cast to simple types to avoid deep instantiation
        const flashcards = flashcardsData as SimpleFlashcard[];
        
        content += `🎯 COMPREHENSIVE CONTENT FROM THIS MATERIAL:
This material contains ${flashcards.length} key concepts and study points:

`;
        
        // Include ALL flashcards, organized by difficulty if available
        const easyCards = flashcards.filter(card => card.difficulty_level === 'easy');
        const mediumCards = flashcards.filter(card => card.difficulty_level === 'medium');
        const hardCards = flashcards.filter(card => card.difficulty_level === 'hard');
        const ungraded = flashcards.filter(card => !card.difficulty_level);

        if (easyCards.length > 0) {
          content += `📝 FOUNDATIONAL CONCEPTS (${easyCards.length} items):\n`;
          easyCards.forEach((card, index) => {
            content += `${index + 1}. Q: ${card.question}\n   A: ${card.answer}\n`;
            content += '\n';
          });
        }

        if (mediumCards.length > 0) {
          content += `🎯 INTERMEDIATE CONCEPTS (${mediumCards.length} items):\n`;
          mediumCards.forEach((card, index) => {
            content += `${index + 1}. Q: ${card.question}\n   A: ${card.answer}\n`;
            content += '\n';
          });
        }

        if (hardCards.length > 0) {
          content += `🚀 ADVANCED CONCEPTS (${hardCards.length} items):\n`;
          hardCards.forEach((card, index) => {
            content += `${index + 1}. Q: ${card.question}\n   A: ${card.answer}\n`;
            content += '\n';
          });
        }

        if (ungraded.length > 0) {
          content += `📋 ADDITIONAL CONCEPTS (${ungraded.length} items):\n`;
          ungraded.forEach((card, index) => {
            content += `${index + 1}. Q: ${card.question}\n   A: ${card.answer}\n`;
            content += '\n';
          });
        }

        content += `
✨ TEACHING GUIDANCE:
I have complete access to all ${flashcards.length} concepts from this material. I can:
- Explain any concept in detail with examples
- Create connections between different topics
- Generate practice questions and quizzes
- Provide step-by-step breakdowns of complex ideas
- Offer real-world applications and analogies
- Help with memorization techniques and study strategies

The student can ask me about ANY topic covered in this material and I'll provide comprehensive, personalized explanations!
`;
      } else {
        // Try to get any other available content
        console.log('No flashcards found, trying extracted text...');
        
        // FIXED: Use the same approach for extracted texts
        const extractedTextQuery = supabase
          .from('cramintel_extracted_texts')
          .select('extracted_text, word_count, extraction_confidence')
          .eq('material_id', material.id)
          .limit(1);

        const extractedTextResult: any = await extractedTextQuery;
        const extractedTextsData = extractedTextResult.data;
        const extractedTextError = extractedTextResult.error;

        if (extractedTextError) {
          console.error('Error fetching extracted text:', extractedTextError);
          throw new Error(`Failed to fetch extracted text: ${extractedTextError.message}`);
        }

        if (extractedTextsData && extractedTextsData.length > 0) {
          const textContent = extractedTextsData[0] as SimpleExtractedText;
          content += `📖 EXTRACTED CONTENT:\n`;
          content += `Word Count: ${textContent.word_count || 'Unknown'}\n`;
          content += `Extraction Confidence: ${textContent.extraction_confidence ? `${(textContent.extraction_confidence * 100).toFixed(1)}%` : 'Unknown'}\n\n`;
          
          // Include a portion of the extracted text
          if (textContent.extracted_text) {
            const textPreview = textContent.extracted_text.length > 2000 
              ? textContent.extracted_text.slice(0, 2000) + '...'
              : textContent.extracted_text;
            content += `Content Preview:\n${textPreview}\n\n`;
          }
        } else {
          console.warn('No extracted text found for material');
          throw new Error('No content found - material may still be processing or extraction failed');
        }

        content += `🎯 INTELLIGENT FEATURES AVAILABLE:
This material has been processed and I can help you with:
- Generating custom practice questions based on the content
- Creating study guides and summaries
- Explaining complex concepts step by step
- Making connections between different topics
- Providing real-world examples and applications

`;
        
        content += `
📖 MATERIAL OVERVIEW:
This ${material.material_type} from ${material.course} contains important academic content that I can help explain and teach. I can:

- Help you understand concepts from ${material.course}
- Create study guides and summaries
- Generate practice questions
- Explain difficult topics step by step
- Provide examples and real-world applications
- Help with exam preparation strategies

Feel free to ask me about any topics you'd like to explore from this material!
`;
      }

      console.log(`Successfully extracted ${content.length} characters of content for ${material.name}`);
      return content;
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      
      // Track extraction errors
      setExtractionErrors(prev => new Set(prev).add(material.id));
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Content Extraction Failed",
        description: `Failed to extract content from ${material.name}: ${errorMessage}`,
        variant: "destructive"
      });

      return `📚 Material: ${material.name}
🎓 Course: ${material.course}
📁 Type: ${material.material_type}

⚠️ Content extraction failed: ${errorMessage}

This might be because:
- The material is still being processed
- There was an error during content extraction
- The file format isn't supported yet

You can still ask me general questions about ${material.course} topics, and I'll do my best to help!`;
    }
  };

  const handleAttachMaterial = async (material: Material) => {
    if (attachedMaterials.find(m => m.id === material.id)) {
      setShowMaterialBrowser(false);
      return;
    }

    setLoadingMaterials(prev => new Set(prev).add(material.id));

    try {
      const content = await extractPDFContent(material);
      
      const attachedMaterial: AttachedMaterial = {
        id: material.id,
        name: material.name,
        type: 'material',
        content
      };
      
      console.log(`Attaching material with ${content.length} characters of content:`, attachedMaterial.name);
      onAttach([...attachedMaterials, attachedMaterial]);
      setShowMaterialBrowser(false);

      toast({
        title: "Material Attached",
        description: `Successfully attached ${material.name} to the conversation`,
      });
    } catch (error) {
      console.error('Error attaching material:', error);
      toast({
        title: "Attachment Failed",
        description: `Failed to attach ${material.name}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoadingMaterials(prev => {
        const newSet = new Set(prev);
        newSet.delete(material.id);
        return newSet;
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const attachedMaterial: AttachedMaterial = {
        id: `upload-${Date.now()}`,
        name: file.name,
        type: 'upload',
        content: e.target?.result as string
      };
      onAttach([...attachedMaterials, attachedMaterial]);
      
      toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${file.name}`,
      });
    };

    // Handle different file types
    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      // For other file types, just store basic info
      const attachedMaterial: AttachedMaterial = {
        id: `upload-${Date.now()}`,
        name: file.name,
        type: 'upload',
        content: `Uploaded file: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.type || 'Unknown'}`
      };
      onAttach([...attachedMaterials, attachedMaterial]);
      
      toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${file.name}`,
      });
    }

    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Attached Materials</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMaterialBrowser(!showMaterialBrowser)}
            className="text-xs"
          >
            <Search className="w-3 h-3 mr-1" />
            Browse Materials
          </Button>
          <label>
            <Button variant="outline" size="sm" className="text-xs cursor-pointer" asChild>
              <span>
                <Upload className="w-3 h-3 mr-1" />
                Upload File
              </span>
            </Button>
            <input
              type="file"
              className="hidden"
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {attachedMaterials.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachedMaterials.map((material) => {
            const hasError = extractionErrors.has(material.id);
            return (
              <Badge
                key={material.id}
                variant="secondary"
                className={`flex items-center gap-1 max-w-xs border ${
                  hasError 
                    ? 'bg-red-100 text-red-700 border-red-200' 
                    : 'bg-green-100 text-green-700 border-green-200'
                }`}
              >
                {hasError ? (
                  <AlertCircle className="w-3 h-3" />
                ) : material.type === 'material' ? (
                  <FileText className="w-3 h-3" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                <span className="text-xs truncate">{material.name}</span>
                {!hasError && <span className="text-xs text-green-600">✓</span>}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-0 w-4 h-4 ${
                    hasError ? 'hover:bg-red-200' : 'hover:bg-green-200'
                  }`}
                  onClick={() => onDetach(material.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {showMaterialBrowser && (
        <Card className="border border-gray-200">
          <CardContent className="p-3">
            <h4 className="text-sm font-medium mb-2">Your Materials</h4>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading materials...
              </div>
            ) : materials.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {materials.map((material) => {
                  const isAttached = attachedMaterials.find(m => m.id === material.id) !== undefined;
                  const isLoading = loadingMaterials.has(material.id);
                  const hasError = extractionErrors.has(material.id);
                  
                  return (
                    <button
                      key={material.id}
                      onClick={() => handleAttachMaterial(material)}
                      disabled={isAttached || isLoading}
                      className={`w-full text-left p-2 rounded hover:bg-gray-50 flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                        hasError ? 'bg-red-50 border border-red-200' : ''
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      ) : hasError ? (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      ) : (
                        <FileText className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="flex-1 truncate">{material.name}</span>
                      <span className="text-gray-400">
                        ({material.course || 'No course'})
                      </span>
                      {isAttached && (
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                      {hasError && (
                        <span className="text-red-500 text-xs">⚠</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No materials available. Upload some materials first!</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Paperclip, X, FileText, Image, Upload, Search, Loader2 } from 'lucide-react';
import { Material, useMaterials } from '@/hooks/useMaterials';
import { supabase } from '@/integrations/supabase/client';

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

export function MaterialAttachment({ attachedMaterials, onAttach, onDetach }: MaterialAttachmentProps) {
  const [showMaterialBrowser, setShowMaterialBrowser] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState<Set<string>>(new Set());
  const { materials, loading } = useMaterials();

  const extractPDFContent = async (material: Material): Promise<string> => {
    try {
      console.log(`Extracting content for material: ${material.name}`);
      
      // Get ALL flashcards for this material (not just 5) - removed 'tags' column
      const { data: flashcards, error: flashcardError } = await supabase
        .from('cramintel_flashcards')
        .select('question, answer, difficulty_level, course')
        .eq('material_id', material.id)
        .order('created_at', { ascending: true });

      let content = `📚 STUDY MATERIAL: ${material.name}
🎓 Course: ${material.course || 'General Studies'}  
📁 Type: ${material.material_type || 'Document'}
📄 File: ${material.file_name}
📅 Uploaded: ${new Date(material.upload_date).toLocaleDateString()}
✅ Processing Status: ${material.processed ? 'Fully Processed' : 'Processing...'}

`;

      if (!flashcardError && flashcards && flashcards.length > 0) {
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
        console.log('No flashcards found or error occurred:', flashcardError);
        
        // Check for extracted text content
        const { data: extractedTexts } = await supabase
          .from('cramintel_extracted_texts')
          .select('extracted_text, word_count, extraction_confidence')
          .eq('material_id', material.id)
          .limit(1);

        if (extractedTexts && extractedTexts.length > 0) {
          const textContent = extractedTexts[0];
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
        }

        // Check if there are any predictions or other processed content
        const { data: predictions } = await supabase
          .from('cramintel_predictions')
          .select('questions')
          .eq('material_id', material.id)
          .limit(3);

        if (predictions && predictions.length > 0) {
          content += `🎯 SAMPLE QUESTIONS FROM THIS MATERIAL:\n`;
          predictions.forEach((pred, index) => {
            if (pred.questions) {
              content += `\nPrediction Set ${index + 1}:\n${pred.questions}\n`;
            }
          });
        }
        
        content += `
📖 MATERIAL OVERVIEW:
This ${material.material_type} from ${material.course} contains important academic content that I can help explain and teach. ${flashcardError ? 'While I\'m processing the detailed content,' : 'I can:'} 

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
      return `📚 Material: ${material.name}
🎓 Course: ${material.course}
📁 Type: ${material.material_type}

⚠️ I'm having trouble accessing the detailed content right now, but I'm still here to help! You can ask me about topics from ${material.course} and I'll do my best to provide helpful explanations and guidance.

Feel free to tell me what specific topics or concepts you'd like to explore from this material!`;
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
    } catch (error) {
      console.error('Error attaching material:', error);
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
          {attachedMaterials.map((material) => (
            <Badge
              key={material.id}
              variant="secondary"
              className="flex items-center gap-1 bg-green-100 text-green-700 max-w-xs border-green-200"
            >
              {material.type === 'material' ? (
                <FileText className="w-3 h-3" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              <span className="text-xs truncate">{material.name}</span>
              <span className="text-xs text-green-600">✓</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4 hover:bg-green-200"
                onClick={() => onDetach(material.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
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
                  
                  return (
                    <button
                      key={material.id}
                      onClick={() => handleAttachMaterial(material)}
                      disabled={isAttached || isLoading}
                      className="w-full text-left p-2 rounded hover:bg-gray-50 flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
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

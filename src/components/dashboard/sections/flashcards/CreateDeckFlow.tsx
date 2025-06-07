import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, FileText, Plus, Wand2, AlertTriangle } from 'lucide-react';
import { useFlashcardDecks } from '@/hooks/useFlashcardDecks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProcessingAnimation } from '@/components/ProcessingAnimation';

interface CreateDeckFlowProps {
  onClose: () => void;
  onComplete: () => void;
}

interface Material {
  id: string;
  name: string;
  course: string;
  material_type: string;
}

export function CreateDeckFlow({ onClose, onComplete }: CreateDeckFlowProps) {
  const [step, setStep] = useState(1);
  const [deckData, setDeckData] = useState({
    name: '',
    description: '',
    course: '',
    format: 'Q&A',
    tags: [] as string[],
    selectedMaterials: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error' | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    status: 'pending' | 'extracting_text' | 'processing_content' | 'generating_flashcards' | 'saving_flashcards' | 'completed' | 'error';
    progress: number;
    currentMaterial: string;
  }>({ status: 'pending', progress: 0, currentMaterial: '' });

  const { user } = useAuth();
  const { createDeck } = useFlashcardDecks();
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterials();
    testConnection();
  }, [user]);

  const testConnection = async () => {
    if (!user) return;
    
    console.log('Testing Supabase connection...');
    setConnectionStatus('testing');
    
    try {
      const { data, error } = await supabase
        .from('cramintel_materials')
        .select('count')
        .limit(1);
        
      if (error) {
        console.error('Connection test failed:', error);
        setConnectionStatus('error');
        toast({
          title: "Connection Error",
          description: "Unable to connect to the database. Please check your internet connection.",
          variant: "destructive"
        });
      } else {
        console.log('Connection test passed');
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Network error during connection test:', error);
      setConnectionStatus('error');
      toast({
        title: "Network Error",
        description: "Network connection failed. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchMaterials = async () => {
    if (!user) return;

    try {
      console.log('Fetching materials for user:', user.id);
      
      const { data, error } = await supabase
        .from('cramintel_materials')
        .select('id, name, course, material_type')
        .eq('user_id', user.id)
        .eq('processed', true)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching materials:', error);
        toast({
          title: "Error",
          description: "Failed to load materials",
          variant: "destructive"
        });
        return;
      }

      console.log('Successfully fetched materials:', data?.length || 0);
      setMaterials(data || []);
    } catch (error) {
      console.error('Network error fetching materials:', error);
      toast({
        title: "Network Error",
        description: "Unable to load materials. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoadingMaterials(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !deckData.tags.includes(tagInput.trim())) {
      setDeckData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDeckData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleMaterial = (materialId: string) => {
    setDeckData(prev => ({
      ...prev,
      selectedMaterials: prev.selectedMaterials.includes(materialId)
        ? prev.selectedMaterials.filter(id => id !== materialId)
        : [...prev.selectedMaterials, materialId]
    }));
  };

  const processFlashcardsForDeck = async (deckId: string) => {
    if (!user || deckData.selectedMaterials.length === 0) return;

    const selectedMaterialNames = materials
      .filter(m => deckData.selectedMaterials.includes(m.id))
      .map(m => m.name);

    const flashcardsPerMaterial = Math.floor(20 / deckData.selectedMaterials.length);
    let totalFlashcardsGenerated = 0;

    for (let i = 0; i < deckData.selectedMaterials.length; i++) {
      const materialId = deckData.selectedMaterials[i];
      const material = materials.find(m => m.id === materialId);
      
      if (!material) continue;

      setProcessingStatus({
        status: 'generating_flashcards',
        progress: Math.floor((i / deckData.selectedMaterials.length) * 90),
        currentMaterial: material.name
      });

      try {
        console.log(`Processing material ${i + 1}/${deckData.selectedMaterials.length}: ${material.name}`);
        
        const { data: processResult, error: processError } = await supabase.functions.invoke('generate-deck-flashcards', {
          body: { 
            materialId,
            deckId,
            targetCards: i === deckData.selectedMaterials.length - 1 ? 
              (20 - totalFlashcardsGenerated) : // Last material gets remaining cards
              flashcardsPerMaterial
          },
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          }
        });

        if (processError) {
          console.error('Failed to process material:', material.name, processError);
          continue;
        }

        totalFlashcardsGenerated += processResult?.flashcards_generated || 0;
        console.log(`Generated ${processResult?.flashcards_generated} flashcards from ${material.name}`);
        
      } catch (error) {
        console.error('Error processing material:', material.name, error);
      }
    }

    // Update deck with actual card count
    await supabase
      .from('cramintel_decks')
      .update({ total_cards: totalFlashcardsGenerated })
      .eq('id', deckId);

    setProcessingStatus({
      status: 'completed',
      progress: 100,
      currentMaterial: ''
    });

    return totalFlashcardsGenerated;
  };

  const handleCreateDeck = async () => {
    if (!deckData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive"
      });
      return;
    }

    if (deckData.selectedMaterials.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one material",
        variant: "destructive"
      });
      return;
    }

    if (connectionStatus === 'error') {
      toast({
        title: "Connection Error",
        description: "Cannot create deck due to connection issues. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    setProcessing(true);

    try {
      console.log('Starting deck creation process...');
      console.log('Deck data:', deckData);
      console.log('User:', user?.id);

      const selectedMaterialNames = materials
        .filter(m => deckData.selectedMaterials.includes(m.id))
        .map(m => m.name);

      console.log('Selected materials:', selectedMaterialNames);

      // Create the deck first
      const deck = await createDeck({
        name: deckData.name,
        description: deckData.description,
        course: deckData.course,
        format: deckData.format,
        tags: deckData.tags,
        source_materials: selectedMaterialNames
      });

      if (!deck) {
        throw new Error('Failed to create deck - createDeck returned null');
      }

      console.log('Deck created successfully:', deck.id);

      setProcessingStatus({
        status: 'processing_content',
        progress: 10,
        currentMaterial: selectedMaterialNames[0] || ''
      });

      // Process materials to generate flashcards
      const flashcardsGenerated = await processFlashcardsForDeck(deck.id);
      
      console.log(`Total flashcards generated: ${flashcardsGenerated}`);
      
      toast({
        title: "Success",
        description: `Deck created with ${flashcardsGenerated} flashcards generated from your materials`,
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Error creating deck:', error);
      setProcessingStatus({
        status: 'error',
        progress: 0,
        currentMaterial: ''
      });
      
      // Enhanced error reporting
      const errorMessage = error.message || 'Unknown error occurred';
      const errorDetails = error.details || error.code || '';
      
      toast({
        title: "Error",
        description: `Failed to create deck: ${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <ProcessingAnimation
            status={processingStatus.status}
            progress={processingStatus.progress}
            fileName={processingStatus.currentMaterial}
          />
        </motion.div>
      </div>
    );
  }

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Create New Deck - Basic Info
          {connectionStatus === 'error' && (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
        </CardTitle>
        {connectionStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-red-700 text-sm">
              Connection issues detected. Please check your internet connection and try refreshing the page.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="deckName">Deck Name</Label>
          <Input
            id="deckName"
            value={deckData.name}
            onChange={(e) => setDeckData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Biology Chapter 3"
          />
        </div>

        <div>
          <Label htmlFor="deckDescription">Description</Label>
          <Textarea
            id="deckDescription"
            value={deckData.description}
            onChange={(e) => setDeckData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Briefly describe what this deck covers..."
          />
        </div>

        <div>
          <Label htmlFor="deckCourse">Course</Label>
          <Input
            id="deckCourse"
            value={deckData.course}
            onChange={(e) => setDeckData(prev => ({ ...prev, course: e.target.value }))}
            placeholder="e.g., BIO 101"
          />
        </div>

        <div>
          <Label htmlFor="deckFormat">Format</Label>
          <Select value={deckData.format} onValueChange={(value) => setDeckData(prev => ({ ...prev, format: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q&A">Q&A</SelectItem>
              <SelectItem value="Fill-in-the-blank">Fill-in-the-blank</SelectItem>
              <SelectItem value="Definitions">Definitions</SelectItem>
              <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag..."
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button type="button" onClick={addTag} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {deckData.tags.map(tag => (
              <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-blue-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => setStep(2)}
            disabled={connectionStatus === 'error'}
          >
            Next: Select Materials
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Select Source Materials
          {connectionStatus === 'connected' && (
            <span className="text-green-600 text-sm">✓ Connected</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">Choose materials to generate 20 quality flashcards from:</p>
        
        {loadingMaterials ? (
          <div className="text-center py-8">Loading materials...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No processed materials found</p>
            <p className="text-sm">Upload and process some materials first</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {materials.map(material => (
              <div key={material.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  checked={deckData.selectedMaterials.includes(material.id)}
                  onCheckedChange={() => toggleMaterial(material.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{material.name}</p>
                  <p className="text-sm text-gray-600">{material.course} - {material.material_type}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {deckData.selectedMaterials.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              ✨ AI will generate approximately 20 quality flashcards from {deckData.selectedMaterials.length} selected material{deckData.selectedMaterials.length > 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button 
            onClick={handleCreateDeck} 
            disabled={creating || deckData.selectedMaterials.length === 0 || connectionStatus === 'error'}
          >
            {creating ? "Creating..." : "Create Deck & Generate Flashcards"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 ? renderStep1() : renderStep2()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

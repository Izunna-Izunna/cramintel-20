
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, FileText, Plus, Wand2 } from 'lucide-react';
import { useFlashcardDecks } from '@/hooks/useFlashcardDecks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const { user } = useAuth();
  const { createDeck } = useFlashcardDecks();
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  const fetchMaterials = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cramintel_materials')
        .select('id, name, course, material_type')
        .eq('user_id', user.id)
        .eq('processed', true)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching materials:', error);
        return;
      }

      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
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

  const createSampleFlashcards = async (deckId: string) => {
    if (!user) return;

    // Create some sample flashcards for demonstration
    const sampleCards = [
      {
        question: "What is the main topic of this deck?",
        answer: deckData.description || "This deck covers important concepts for studying.",
        course: deckData.course,
        difficulty_level: "medium",
        user_id: user.id
      },
      {
        question: "How can you use this flashcard deck effectively?",
        answer: "Review regularly, focus on cards you find difficult, and use spaced repetition for better retention.",
        course: deckData.course,
        difficulty_level: "easy",
        user_id: user.id
      }
    ];

    try {
      // Insert flashcards
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from('cramintel_flashcards')
        .insert(sampleCards)
        .select();

      if (flashcardsError) {
        console.error('Error creating flashcards:', flashcardsError);
        return;
      }

      // Link flashcards to deck
      const deckFlashcards = flashcardsData.map(card => ({
        deck_id: deckId,
        flashcard_id: card.id
      }));

      const { error: linkError } = await supabase
        .from('cramintel_deck_flashcards')
        .insert(deckFlashcards);

      if (linkError) {
        console.error('Error linking flashcards to deck:', linkError);
      }
    } catch (error) {
      console.error('Error creating sample flashcards:', error);
    }
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

    setCreating(true);

    try {
      const selectedMaterialNames = materials
        .filter(m => deckData.selectedMaterials.includes(m.id))
        .map(m => m.name);

      const deck = await createDeck({
        name: deckData.name,
        description: deckData.description,
        course: deckData.course,
        format: deckData.format,
        tags: deckData.tags,
        source_materials: selectedMaterialNames
      });

      if (deck) {
        // Create sample flashcards
        await createSampleFlashcards(deck.id);
        
        toast({
          title: "Success",
          description: "Deck created with sample flashcards",
        });
        
        onComplete();
      }
    } catch (error) {
      console.error('Error creating deck:', error);
      toast({
        title: "Error",
        description: "Failed to create deck",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Create New Deck - Basic Info
        </CardTitle>
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
          <Button onClick={() => setStep(2)}>
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
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">Choose which uploaded materials to use for generating flashcards:</p>
        
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

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button onClick={handleCreateDeck} disabled={creating}>
            {creating ? "Creating..." : "Create Deck"}
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

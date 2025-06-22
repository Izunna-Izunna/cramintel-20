
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, FileText, Target, Lightbulb, Upload } from 'lucide-react';
import { useMaterials } from '@/hooks/useMaterials';
import { MaterialCategory } from '@/types/predictions';

interface EnhancedUploadStepProps {
  selectedMaterials: string[];
  onMaterialsChange: (materials: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const materialCategories: Omit<MaterialCategory, 'materials'>[] = [
  {
    id: 'core',
    name: 'Core Materials',
    icon: '📚',
    description: 'Lecture Notes & Slides, Course Outlines, Textbook Chapters'
  },
  {
    id: 'exam-intel',
    name: 'Past Exam Intelligence',
    icon: '📝',
    description: 'Previous Years\' Questions, Sample/Mock Exams, Test Scripts'
  },
  {
    id: 'assignments',
    name: 'Assignment Patterns',
    icon: '🎯',
    description: 'Coursework Questions, Lab Reports, Assignment Feedback'
  },
  {
    id: 'insider',
    name: 'Insider Intelligence',
    icon: '💡',
    description: 'Class Discussion Notes, Lecturer Emphasis, Study Group Insights'
  }
];

export function EnhancedUploadStep({ 
  selectedMaterials, 
  onMaterialsChange, 
  onNext, 
  onBack 
}: EnhancedUploadStepProps) {
  const { materials } = useMaterials();
  const [showUpload, setShowUpload] = useState(false);

  // Categorize materials based on type and name
  const categorizeMaterials = (materials: any[]): MaterialCategory[] => {
    return materialCategories.map(category => {
      const categoryMaterials = materials.filter(material => {
        const name = material.name?.toLowerCase() || '';
        const type = material.material_type?.toLowerCase() || '';
        
        switch (category.id) {
          case 'core':
            return type.includes('lecture') || name.includes('note') || name.includes('slide') || 
                   name.includes('outline') || name.includes('syllabus') || name.includes('textbook');
          case 'exam-intel':
            return type.includes('past-question') || name.includes('past') || name.includes('exam') ||
                   name.includes('test') || name.includes('sample') || name.includes('mock');
          case 'assignments':
            return type.includes('assignment') || name.includes('assignment') || name.includes('coursework') ||
                   name.includes('lab') || name.includes('project') || name.includes('homework');
          case 'insider':
            return name.includes('discussion') || name.includes('emphasis') || name.includes('hint') ||
                   name.includes('insight') || name.includes('tip') || name.includes('whisper');
          default:
            return false;
        }
      });

      return {
        ...category,
        materials: categoryMaterials.map(m => m.id)
      };
    });
  };

  const categorizedMaterials = categorizeMaterials(materials);

  const handleMaterialToggle = (materialId: string) => {
    const newSelected = selectedMaterials.includes(materialId)
      ? selectedMaterials.filter(id => id !== materialId)
      : [...selectedMaterials, materialId];
    onMaterialsChange(newSelected);
  };

  const handleCategoryToggle = (categoryMaterials: string[]) => {
    const allSelected = categoryMaterials.every(id => selectedMaterials.includes(id));
    if (allSelected) {
      // Deselect all in category
      onMaterialsChange(selectedMaterials.filter(id => !categoryMaterials.includes(id)));
    } else {
      // Select all in category
      const newSelected = [...new Set([...selectedMaterials, ...categoryMaterials])];
      onMaterialsChange(newSelected);
    }
  };

  const getMaterialById = (id: string) => materials.find(m => m.id === id);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Select Your Study Materials</h3>
        <p className="text-gray-600">Choose materials from each category to improve prediction accuracy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categorizedMaterials.map(category => (
          <Card key={category.id} className="border-2 hover:border-gray-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCategoryToggle(category.materials)}
                  className="text-xs"
                >
                  {category.materials.every(id => selectedMaterials.includes(id)) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {category.materials.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-3">No materials in this category yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUpload(true)}
                    className="text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload Materials
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {category.materials.map(materialId => {
                    const material = getMaterialById(materialId);
                    if (!material) return null;
                    
                    return (
                      <div key={materialId} className="flex items-center space-x-2">
                        <Checkbox
                          id={materialId}
                          checked={selectedMaterials.includes(materialId)}
                          onCheckedChange={() => handleMaterialToggle(materialId)}
                        />
                        <label 
                          htmlFor={materialId}
                          className="text-sm cursor-pointer hover:text-gray-800 flex-1"
                        >
                          {material.name}
                        </label>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {material.file_type?.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMaterials.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800">
              <strong>{selectedMaterials.length} materials selected</strong> - 
              Mix of categories will improve prediction accuracy
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={selectedMaterials.length === 0}
          className="bg-gray-800 hover:bg-gray-900 text-white"
        >
          Continue to Context
        </Button>
      </div>
    </div>
  );
}

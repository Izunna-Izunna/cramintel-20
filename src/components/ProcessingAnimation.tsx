
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProcessingAnimationProps {
  status: 'extracting_text' | 'processing_content' | 'generating_flashcards' | 'saving_flashcards' | 'completed' | 'error';
  progress: number;
  fileName: string;
}

export function ProcessingAnimation({ status, progress, fileName }: ProcessingAnimationProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'extracting_text':
        return {
          icon: FileText,
          title: 'Extracting Content',
          description: 'Reading and extracting text from your document...',
          color: 'text-blue-500'
        };
      case 'processing_content':
        return {
          icon: Brain,
          title: 'Processing Content',
          description: 'Analyzing content structure and key concepts...',
          color: 'text-purple-500'
        };
      case 'generating_flashcards':
        return {
          icon: Brain,
          title: 'Generating Flashcards',
          description: 'AI is creating 20 high-quality flashcards from your material...',
          color: 'text-orange-500'
        };
      case 'saving_flashcards':
        return {
          icon: CheckCircle,
          title: 'Saving Flashcards',
          description: 'Saving your flashcards to your deck...',
          color: 'text-green-500'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          title: 'Processing Complete!',
          description: 'Your flashcards are ready for studying',
          color: 'text-green-500'
        };
      case 'error':
        return {
          icon: AlertCircle,
          title: 'Processing Failed',
          description: 'There was an error processing your document',
          color: 'text-red-500'
        };
      default:
        return {
          icon: FileText,
          title: 'Processing...',
          description: 'Working on your document...',
          color: 'text-gray-500'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Animated Icon */}
          <motion.div
            className={`mx-auto w-16 h-16 ${statusInfo.color} flex items-center justify-center`}
            animate={{
              scale: status === 'completed' ? [1, 1.1, 1] : [1, 1.05, 1],
              rotate: status === 'generating_flashcards' ? [0, 360] : 0
            }}
            transition={{
              duration: status === 'completed' ? 0.6 : 2,
              repeat: status === 'completed' ? 0 : Infinity,
              ease: "easeInOut"
            }}
          >
            <Icon className="w-8 h-8" />
          </motion.div>

          {/* Status Text */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{statusInfo.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{statusInfo.description}</p>
            <p className="text-xs text-gray-500 mt-2 truncate">{fileName}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
          </div>

          {/* Processing Steps */}
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${progress >= 20 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={progress >= 20 ? 'text-green-600' : 'text-gray-500'}>Extract content</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${progress >= 40 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={progress >= 40 ? 'text-green-600' : 'text-gray-500'}>Analyze structure</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${progress >= 60 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={progress >= 60 ? 'text-green-600' : 'text-gray-500'}>Generate flashcards</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${progress >= 80 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={progress >= 80 ? 'text-green-600' : 'text-gray-500'}>Save to deck</span>
            </div>
          </div>

          {/* Estimated Time */}
          {status !== 'completed' && status !== 'error' && (
            <p className="text-xs text-gray-500">
              Estimated time: {Math.max(1, Math.ceil((100 - progress) / 20))} minutes
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Brain, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProcessingAnimationProps {
  status: 'pending' | 'processing' | 'extracting_text' | 'processing_content' | 'generating_flashcards' | 'saving_flashcards' | 'completed' | 'error';
  progress: number;
  fileName: string;
  errorMessage?: string;
}

export function ProcessingAnimation({ status, progress, fileName, errorMessage }: ProcessingAnimationProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          title: 'Preparing to Process',
          description: 'Setting up processing pipeline for your document...',
          color: 'text-gray-500'
        };
      case 'processing':
        return {
          icon: FileText,
          title: 'Processing File',
          description: 'Analyzing your document structure...',
          color: 'text-blue-500'
        };
      case 'extracting_text':
        return {
          icon: FileText,
          title: 'Extracting Content',
          description: 'Using Google Vision AI to extract text from your document...',
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
          description: 'Your 20 flashcards are ready for studying',
          color: 'text-green-500'
        };
      case 'error':
        return {
          icon: AlertCircle,
          title: 'Processing Failed',
          description: errorMessage || 'There was an error processing your document',
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
              scale: status === 'completed' ? [1, 1.1, 1] : status === 'error' ? [1, 1.05, 1] : [1, 1.05, 1],
              rotate: status === 'generating_flashcards' ? [0, 360] : 0
            }}
            transition={{
              duration: status === 'completed' ? 0.6 : status === 'error' ? 0.8 : 2,
              repeat: status === 'completed' || status === 'error' ? 0 : Infinity,
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

          {/* Progress Bar - Hide for error state */}
          {status !== 'error' && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Error Details */}
          {status === 'error' && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
              <h4 className="text-sm font-medium text-red-800 mb-1">Error Details:</h4>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Processing Steps - Hide for error state */}
          {status !== 'error' && (
            <div className="space-y-2 text-left">
              <div className="flex items-center space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${progress >= 10 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={progress >= 10 ? 'text-green-600' : 'text-gray-500'}>Process file</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${progress >= 30 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={progress >= 30 ? 'text-green-600' : 'text-gray-500'}>Extract text content</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${progress >= 60 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={progress >= 60 ? 'text-green-600' : 'text-gray-500'}>Generate flashcards</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${progress >= 90 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={progress >= 90 ? 'text-green-600' : 'text-gray-500'}>Save to deck</span>
              </div>
            </div>
          )}

          {/* Estimated Time - Only show for active processing */}
          {status !== 'completed' && status !== 'error' && (
            <p className="text-xs text-gray-500">
              Estimated time: {Math.max(1, Math.ceil((100 - progress) / 30))} minutes
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { OnboardingData } from '@/pages/Onboarding';
import { useToast } from '@/hooks/use-toast';

interface CompletionStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  onComplete: () => void;
}

const studyTips = [
  "📚 Break down complex topics into smaller chunks",
  "🧠 Use active recall instead of just re-reading",
  "⏰ The Pomodoro Technique: 25 min study, 5 min break",
  "🔄 Spaced repetition helps with long-term retention",
  "💡 Teach someone else to test your understanding"
];

const celebrationMessages = [
  "You're absolutely crushing it! 🔥",
  "What a superstar! ⭐",
  "Incredible setup! 🚀",
  "You're going to ace this! 💯",
  "Legend in the making! 👑"
];

const CompletionStep = ({ data, onComplete }: CompletionStepProps) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  const registerUser = async () => {
    try {
      setIsRegistering(true);
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Registration failed",
          description: "There was an error creating your account. Using offline mode.",
          variant: "destructive",
        });
        // Fall back to localStorage
        localStorage.setItem('cramIntelUser', JSON.stringify(data));
        onComplete();
        return;
      }

      if (authData.user) {
        // Insert user data into cramintelusers table
        const { error: userError } = await supabase
          .from('cramintelusers')
          .insert({
            id: authData.user.id,
            email: data.email,
            name: data.name,
            school: data.school,
            department: data.department,
            study_style: data.studyStyle,
            first_action: data.firstAction,
          });

        if (userError) {
          console.error('User insert error:', userError);
        }

        // Insert courses
        if (data.courses.length > 0) {
          const courseInserts = data.courses.map(course => ({
            user_id: authData.user.id,
            course_name: course,
          }));

          const { error: coursesError } = await supabase
            .from('cramintelcourses')
            .insert(courseInserts);

          if (coursesError) {
            console.error('Courses insert error:', coursesError);
          }
        }

        // Initialize user profile
        const { error: profileError } = await supabase
          .from('cramintelprofile')
          .insert({
            user_id: authData.user.id,
            study_streak: 0,
            total_study_time: 0,
            cards_mastered_total: 0,
            documents_uploaded: 0,
            ai_questions_asked: 0,
            achievements: {},
          });

        if (profileError) {
          console.error('Profile insert error:', profileError);
        }

        toast({
          title: "Welcome to CramIntel!",
          description: "Your account has been created successfully.",
        });
      }

      localStorage.removeItem('onboardingProgress');
      onComplete();
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: "Using offline mode for now.",
        variant: "destructive",
      });
      localStorage.setItem('cramIntelUser', JSON.stringify(data));
      onComplete();
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    setShowFireworks(true);
    
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % studyTips.length);
    }, 2000);

    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % celebrationMessages.length);
    }, 1500);

    // Start registration process
    const timer = setTimeout(() => {
      registerUser();
    }, 1000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(messageInterval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <motion.div
      className="text-center space-y-6 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
    >
      {/* Massive confetti explosion */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 7)],
                width: Math.random() * 12 + 4,
                height: Math.random() * 12 + 4,
              }}
              animate={{
                y: [0, -300, 200],
                x: [0, Math.random() * 400 - 200],
                rotate: [0, 720],
                opacity: [1, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 0.5,
                repeat: Infinity,
                repeatDelay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated celebration emoji */}
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1, 1.2, 1],
          rotate: [0, 10, -10, 5, 0]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-8xl mb-4 filter drop-shadow-lg">🎊</div>
      </motion.div>

      <div className="space-y-4 relative z-10">
        <motion.h1
          className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          Nice one, {data.name}! 🎉
        </motion.h1>
        
        <motion.div
          key={currentMessage}
          className="text-xl font-semibold text-gray-800"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {celebrationMessages[currentMessage]}
        </motion.div>
        
        <motion.p
          className="text-gray-600 text-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {isRegistering ? "Creating your account..." : "Your dashboard is loading..."}
        </motion.p>
        
        <motion.p
          className="text-gray-800 font-bold text-xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Time to cut the noise and learn what counts.
        </motion.p>
      </div>

      <motion.div
        className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-blue-200 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50"
          animate={{ x: [-100, 100] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          key={currentTip}
          className="text-gray-700 font-medium relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          💡 Study Tip: {studyTips[currentTip]}
        </motion.p>
      </motion.div>

      {/* Loading animation */}
      <motion.div
        className="flex justify-center space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              delay: i * 0.15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>

      {/* Success badge */}
      <motion.div
        className="absolute top-0 right-0 bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-bl-2xl font-bold"
        initial={{ x: 100, y: -100 }}
        animate={{ x: 0, y: 0 }}
        transition={{ delay: 2, type: "spring", bounce: 0.6 }}
      >
        {isRegistering ? "Setting up..." : "Setup Complete!"} ✅
      </motion.div>
    </motion.div>
  );
};

export default CompletionStep;

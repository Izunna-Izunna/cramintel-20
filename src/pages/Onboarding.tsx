
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src="/lovable-uploads/a7196ea7-817d-4ce5-b937-fae2c3748b18.png" 
          alt="CramIntel - Students Learning Together" 
          className="w-full h-full object-cover opacity-40 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 min-h-screen flex items-center justify-center p-4"
      >
        <div className="w-full max-w-2xl mx-auto text-center">
          <motion.div variants={itemVariants} className="mb-8">
            <div className="text-6xl mb-6">🚀</div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              We're Launching Soon!
            </h1>
            <p className="text-xl text-white/80 mb-8">
              CramIntel is in its final stages of development. Join our waitlist to be the first to experience AI-powered exam predictions and smart study tools.
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Almost Ready</h3>
              <p className="text-white/70 text-sm">Final testing and optimization in progress</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <Users className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Growing Community</h3>
              <p className="text-white/70 text-sm">Thousands of students already waiting</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Early Access</h3>
              <p className="text-white/70 text-sm">Be among the first to try our platform</p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <Button
              onClick={() => navigate('/waitlist')}
              className="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 text-lg rounded-xl"
            >
              Join the Waitlist
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-white/60 hover:text-white/80"
            >
              ← Back to Home
            </Button>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10"
          >
            <p className="text-white/60 text-sm">
              💡 Already have an account? <button onClick={() => navigate('/auth')} className="text-blue-400 hover:text-blue-300 underline">Sign in here</button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;

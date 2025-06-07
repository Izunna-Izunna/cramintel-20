import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Share2, CheckCircle, MessageCircle } from 'lucide-react';
import SEO from '@/components/SEO';

interface WaitlistData {
  email: string;
  firstName: string;
  university: string;
  role: string;
}

const Waitlist = () => {
  const [formData, setFormData] = useState<WaitlistData>({
    email: '',
    firstName: '',
    university: '',
    role: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('waitlist_signups')
        .insert([
          {
            email: formData.email,
            first_name: formData.firstName || null,
            university: formData.university || null,
            role: formData.role || null
          }
        ])
        .select('referral_code')
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already on the list!",
            description: "This email is already registered for our waitlist.",
            variant: "default"
          });
        } else {
          throw error;
        }
      } else {
        setReferralCode(data.referral_code);
        setIsSubmitted(true);
        toast({
          title: "Welcome to the waitlist! 🎉",
          description: "We'll notify you as soon as we launch.",
        });
      }
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shareUrl = `${window.location.origin}/waitlist?ref=${referralCode}`;
  
  const shareOnTwitter = () => {
    const text = "Just joined the CramIntel waitlist! 🎓 AI-powered exam predictions and smart study tools are coming. Join me:";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share this link to invite friends.",
    });
  };

  const joinPilotProgram = () => {
    const userName = formData.firstName || 'there';
    const userUniversity = formData.university ? ` from ${formData.university}` : '';
    const message = `Hi! I'm ${userName}${userUniversity} and I just joined the CramIntel waitlist. I'm excited to be part of the student pilot group to help shape the platform! 🎓`;
    
    const whatsappUrl = `https://chat.whatsapp.com/EFsCw9h30512yHJ7OlMv8a`;
    window.open(whatsappUrl, '_blank');
    
    // Copy the message to clipboard for easy pasting
    navigator.clipboard.writeText(message);
    toast({
      title: "Opening WhatsApp...",
      description: "Your intro message has been copied to clipboard!",
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <SEO 
          title="Thank You - CramIntel Waitlist" 
          description="You're on the CramIntel waitlist! We'll notify you when we launch."
        />
        
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src="/lovable-uploads/a7196ea7-817d-4ce5-b937-fae2c3748b18.png" 
            alt="Success Background" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div 
            className="text-center max-w-lg mx-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <motion.div
              className="mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
            </motion.div>

            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              🎉 You're on the list!
            </motion.h1>

            <motion.p 
              className="text-xl text-white/80 mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              We'll let you know the moment we launch.
            </motion.p>

            <motion.div 
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Want to help shape the platform?</h3>
              <p className="text-white/70 mb-4">Join our student pilot group and get early access to test features!</p>
              <Button 
                onClick={joinPilotProgram}
                className="bg-white text-black hover:bg-gray-100 transition-all"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Join Pilot Program
              </Button>
            </motion.div>

            <motion.div 
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Invite friends and get early access!</h3>
              <p className="text-white/70 mb-4">Share your referral link:</p>
              
              <div className="flex gap-3">
                <Button 
                  onClick={shareOnTwitter}
                  className="bg-white text-black hover:bg-gray-100 flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on Twitter
                </Button>
                <Button 
                  onClick={copyShareLink}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  Copy Link
                </Button>
              </div>
            </motion.div>

            <motion.div 
              className="mt-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Button 
                onClick={() => window.location.href = '/'}
                variant="ghost"
                className="text-white/60 hover:text-white/80"
              >
                ← Back to Home
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <SEO 
        title="Join the Waitlist - CramIntel" 
        description="Be the first to try CramIntel — AI-powered exam predictions, flashcards, and smart study tools for West African university students."
      />
      
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src="/lovable-uploads/a7196ea7-817d-4ce5-b937-fae2c3748b18.png" 
          alt="CramIntel - Students Learning Together" 
          className="w-full h-full object-cover opacity-70 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div 
          className="w-full max-w-md mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Join the smartest students
            </motion.h1>
            <motion.h2 
              className="text-2xl md:text-3xl font-semibold text-white/90 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              getting ready for smarter exam prep.
            </motion.h2>
            <motion.p 
              className="text-lg text-white/70"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Be the first to try CramIntel — AI-powered predictions, flashcards, and more.
            </motion.p>
          </div>

          <motion.div 
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="email"
                  placeholder="your.email@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-500 rounded-xl py-3"
                />
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="First Name (optional)"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-500 rounded-xl py-3"
                />
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="University (optional)"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-500 rounded-xl py-3"
                />
              </div>

              <div>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white rounded-xl py-3">
                    <SelectValue placeholder="I am a... (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Lecturer">Lecturer</SelectItem>
                    <SelectItem value="Campus Ambassador">Campus Ambassador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black hover:bg-gray-100 py-3 rounded-xl font-semibold text-lg transition-all"
              >
                {isLoading ? 'Joining...' : 'Join the Waiting List'}
              </Button>

              <p className="text-center text-white/50 text-sm">
                💡 No spam. Just smart updates.
              </p>
            </form>
          </motion.div>

          <motion.div 
            className="text-center mt-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="text-white/60 hover:text-white/80"
            >
              ← Back to Home
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Waitlist;

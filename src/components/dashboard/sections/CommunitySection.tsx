import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, MessageCircle, Heart, Share, Calendar, Trophy, Zap, Bell, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function CommunitySection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
        duration: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const handleNotifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('waitlist_signups')
        .insert([
          {
            email: email,
            first_name: null,
            university: null,
            role: 'Community Notification'
          }
        ]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already subscribed!",
            description: "This email is already on our notification list.",
            variant: "default"
          });
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        setEmail('');
        toast({
          title: "Successfully subscribed! 🎉",
          description: "We'll notify you when community features are ready.",
        });
      }
    } catch (error) {
      console.error('Error submitting notification signup:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingFeatures = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Study Groups",
      description: "Join course-specific study circles and collaborate with peers",
      status: "Q1 2025"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-purple-600" />,
      title: "Discussion Forums",
      description: "Ask questions, share knowledge, and get help from the community",
      status: "Q1 2025"
    },
    {
      icon: <Trophy className="w-8 h-8 text-green-600" />,
      title: "Peer Challenges",
      description: "Compete with friends in study challenges and quiz competitions",
      status: "Q2 2025"
    },
    {
      icon: <Calendar className="w-8 h-8 text-orange-600" />,
      title: "Study Sessions",
      description: "Schedule and join virtual study sessions with classmates",
      status: "Q2 2025"
    }
  ];

  const communityBenefits = [
    "Connect with students from your university and course",
    "Share study materials and resources",
    "Get answers to your academic questions",
    "Form study groups for better collaboration",
    "Participate in peer-to-peer learning"
  ];

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <motion.div 
        className="relative bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl overflow-hidden"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative p-8 md:p-12 text-center">
          <motion.div variants={itemVariants}>
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              Coming Soon
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-space">
              Connect. Collaborate. Succeed.
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Join a vibrant community of students who learn together, share knowledge, 
              and achieve academic excellence through collaboration.
            </p>
          </motion.div>

          {/* Notification Signup */}
          <motion.div variants={itemVariants} className="max-w-md mx-auto">
            {!subscribed ? (
              <form onSubmit={handleNotifySignup} className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  required
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit" 
                  className="bg-white text-gray-800 hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Notify Me'}
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 text-green-300">
                <CheckCircle className="w-5 h-5" />
                <span>Thanks! We'll notify you when it's ready.</span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Features Preview */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 font-space">What's Coming</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're building powerful community features to enhance your learning experience
            and connect you with fellow students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {feature.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Benefits Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gray-50 border-0">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4 font-space">
                  Why Join the CramIntel Community?
                </h3>
                <div className="space-y-3">
                  {communityBenefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-3"
                      variants={itemVariants}
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      CU
                    </div>
                    <div>
                      <h4 className="font-semibold">CramIntel University</h4>
                      <p className="text-sm text-gray-500">2,500+ active students</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📚 245 study groups</p>
                    <p>💬 1,200+ discussions this week</p>
                    <p>🎯 89% pass rate improvement</p>
                  </div>
                </div>
                
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Preview
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Development Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-1">Q1 2025</h4>
                <p className="text-sm text-gray-600">Study Groups & Forums</p>
              </div>
              
              <ArrowRight className="w-6 h-6 text-gray-400 rotate-90 md:rotate-0" />
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Trophy className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-1">Q2 2025</h4>
                <p className="text-sm text-gray-600">Challenges & Events</p>
              </div>
              
              <ArrowRight className="w-6 h-6 text-gray-400 rotate-90 md:rotate-0" />
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold mb-1">Q3 2025</h4>
                <p className="text-sm text-gray-600">Advanced Features</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Call to Action */}
      <motion.div variants={itemVariants} className="text-center">
        <Card className="bg-gradient-to-r from-gray-800 to-gray-700 text-white border-0">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4 font-space">
              Be Among the First to Experience It
            </h3>
            <p className="text-gray-200 mb-6 max-w-2xl mx-auto">
              Join thousands of students who are already using CramIntel to ace their exams. 
              When our community features launch, you'll be ready to connect and collaborate.
            </p>
            <Button className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-3">
              Continue Studying
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

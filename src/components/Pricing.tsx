
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Clock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
        duration: 0.8
      }
    }
  };
  
  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12 md:mb-16" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }} 
          variants={containerVariants}
        >
          <motion.h2 variants={cardVariants} className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Learning Plan
          </motion.h2>
          <motion.p variants={cardVariants} className="text-gray-600 text-lg max-w-3xl mx-auto">
            Start your journey to academic excellence with our smart learning tools
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }} 
          variants={containerVariants}
        >
          {/* Free Plan */}
          <motion.div variants={cardVariants} className="relative bg-white rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-400 to-green-600 text-white text-center py-2 font-bold">
              <Sparkles className="inline w-4 h-4 mr-1" />
              LAUNCH SPECIAL
            </div>
            <div className="p-8 pt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Student Starter</h3>
              <div className="mb-6">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-3xl font-bold text-gray-400 line-through mr-3">$29</span>
                  <span className="text-4xl font-bold text-green-600">FREE</span>
                </div>
                <p className="text-gray-600 text-sm">per month</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>AI Exam Predictions</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Basic Flashcards</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Study Communities</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Course Material Upload</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Grade Tracking</span>
                </li>
              </ul>
              <Button 
                onClick={scrollToContact}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
              >
                Start Learning Free
              </Button>
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div variants={cardVariants} className="relative bg-white rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-center py-2 font-bold">
              <Clock className="inline w-4 h-4 mr-1" />
              COMING SOON
            </div>
            <div className="p-8 pt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Student Pro</h3>
              <div className="mb-6">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-gray-900">$19</span>
                </div>
                <p className="text-gray-600 text-sm">per month</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span>Everything in Starter</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span>Advanced Analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span>Priority AI Processing</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span>Unlimited Flashcards</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span>Personal Study Coach</span>
                </li>
              </ul>
              <Button 
                onClick={scrollToContact}
                variant="outline"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 py-3 text-lg font-semibold"
              >
                Get Notified
              </Button>
            </div>
          </motion.div>

          {/* University Plan */}
          <motion.div variants={cardVariants} className="relative bg-white rounded-2xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-400 to-purple-600 text-white text-center py-2 font-bold">
              <Crown className="inline w-4 h-4 mr-1" />
              COMING SOON
            </div>
            <div className="p-8 pt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">University</h3>
              <div className="mb-6">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-gray-900">$99</span>
                </div>
                <p className="text-gray-600 text-sm">per month</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Institution Dashboard</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Bulk Student Management</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Custom Integrations</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Dedicated Support</span>
                </li>
              </ul>
              <Button 
                onClick={scrollToContact}
                variant="outline"
                className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 py-3 text-lg font-semibold"
              >
                Get Notified
              </Button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="text-center mt-12" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          variants={cardVariants}
        >
          <p className="text-gray-600 text-lg">
            Questions about our plans? <button onClick={scrollToContact} className="text-blue-600 hover:text-blue-700 underline">Get in touch</button>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;

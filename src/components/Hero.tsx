
import { ArrowRight, Code, Cpu, Layers, MessageSquare, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const containerVariants = {
    hidden: {
      opacity: 0
    },
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
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };
  
  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  
  const handleJoinWaitlist = () => {
    navigate('/waitlist');
  };

  const handleExistingUser = () => {
    navigate('/auth');
  };
  
  return <motion.div className="relative mt-16 md:mt-0 w-full max-w-[100vw]" initial="hidden" animate="visible" variants={containerVariants}>
      <div className="banner-container bg-black relative overflow-hidden h-[700px] md:h-[750px] w-full">
        <div className="absolute inset-0 bg-black w-full">
          <img src="/lovable-uploads/a7196ea7-817d-4ce5-b937-fae2c3748b18.png" alt="CramIntel - Student Silhouettes Learning Together" className={`w-full h-full object-cover opacity-70 grayscale ${isMobile ? 'object-right' : 'object-center'}`} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-white"></div>
        </div>
        
        <div className="banner-overlay bg-transparent pt-21 md:pt-24 w-full">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center h-full">
            <motion.div className="w-full max-w-4xl text-center" variants={itemVariants}>
              {/* Launch Status Badge */}
              <motion.div 
                variants={itemVariants}
                className="inline-flex items-center gap-2 bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 mb-6"
              >
                <Clock className="w-4 h-4 text-blue-300" />
                <span className="text-blue-200 text-sm font-medium">Launching Soon - Join the Waitlist</span>
              </motion.div>

              <motion.h1 className="banner-title text-white text-3xl md:text-5xl lg:text-6xl font-bold" variants={itemVariants}>Cut the noise. Learn what counts.</motion.h1>
              <motion.p className="banner-subtitle text-gray-300 mt-4 md:mt-6 text-sm md:text-base max-w-2xl mx-auto" variants={itemVariants}>
                AI-powered exam predictions, smart flashcards, and study tools designed for West African university students.
              </motion.p>
              <motion.div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6 md:mt-8 justify-center" variants={itemVariants}>
                <button 
                  className="px-6 md:px-8 py-2 md:py-3 bg-white text-black rounded-md hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:shadow-white/20 flex items-center justify-center group text-sm md:text-base font-semibold"
                  onClick={handleJoinWaitlist}
                >
                  Join Waitlist
                  <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  className="px-6 md:px-8 py-2 md:py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all shadow-lg hover:shadow-xl hover:shadow-gray-300/20 flex items-center justify-center group text-sm md:text-base"
                  onClick={e => {
                    e.preventDefault();
                    const projectsSection = document.getElementById('projects');
                    if (projectsSection) {
                      projectsSection.scrollIntoView({
                        behavior: 'smooth'
                      });
                    }
                  }}
                >
                  See Success Stories
                  <MessageSquare className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                </button>
              </motion.div>
              
              <motion.p 
                className="text-white/60 text-xs md:text-sm mt-4"
                variants={itemVariants}
              >
                Already have an account? <button onClick={handleExistingUser} className="text-blue-400 hover:text-blue-300 underline">Sign in here</button>
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 mx-auto">
        <motion.div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4" variants={containerVariants} initial="hidden" animate="visible" transition={{
        delay: 0.6
      }}>
          <motion.div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-md" variants={itemVariants}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 flex items-center justify-center rounded-lg text-gray-500 mb-2 md:mb-3">
              <Cpu className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 text-gray-800">AI Exam Predictions</h3>
            <p className="text-gray-600 text-xs md:text-sm">Upload your notes and past questions to get AI-powered predictions of likely exam questions.</p>
          </motion.div>
          
          <motion.div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-md" variants={itemVariants}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 flex items-center justify-center rounded-lg text-gray-500 mb-2 md:mb-3">
              <Code className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 text-gray-800">Smart Study Tools</h3>
            <p className="text-gray-600 text-xs md:text-sm">Auto-generated flashcards, quizzes, and interactive study materials from your uploaded content.</p>
          </motion.div>
          
          <motion.div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-md" variants={itemVariants}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 flex items-center justify-center rounded-lg text-gray-500 mb-2 md:mb-3">
              <Layers className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 text-gray-800">Study Communities</h3>
            <p className="text-gray-600 text-xs md:text-sm">Join course-specific study circles and collaborate with peers for better exam preparation.</p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>;
};

export default Hero;

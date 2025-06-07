import { ArrowLeft, CheckCircle, ArrowRight, Users, Target, Brain, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import SEO from '@/components/SEO';

const About = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <PageLayout>
      <SEO 
        title="About CramIntel - Revolutionizing Student Success in West Africa"
        description="Learn how CramIntel is transforming university education across West Africa with AI-powered exam predictions and smart study tools that help students achieve better grades."
        keywords={['About CramIntel', 'student success', 'West Africa education', 'AI learning platform', 'university study tools', 'exam predictions']}
      />
      
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            
            <motion.h1 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }} 
              className="text-4xl font-bold mb-6"
            >
              About CramIntel
            </motion.h1>
            
            <div className="prose prose-lg max-w-none">
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.5, delay: 0.2 }} 
                className="text-xl text-gray-600 mb-12"
              >
                We're revolutionizing how West African university students approach learning through AI-powered exam predictions and smart study tools.
              </motion.p>

              {/* Success Metrics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16"
              >
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-blue-600">500+</h3>
                  <p className="text-gray-600">Beta Students</p>
                </div>
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-green-600">85%</h3>
                  <p className="text-gray-600">Grade Improvement</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-6 text-center">
                  <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-purple-600">92%</h3>
                  <p className="text-gray-600">Prediction Accuracy</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-6 text-center">
                  <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-orange-600">50%</h3>
                  <p className="text-gray-600">Less Study Time</p>
                </div>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  <h2 className="text-3xl font-bold">Our Mission</h2>
                  <p className="text-gray-600">
                    At CramIntel, we're on a mission to transform how West African university students 
                    approach learning. We believe every student deserves access to intelligent study tools 
                    that cut through the noise and focus on what truly matters for exam success.
                  </p>
                  <p className="text-gray-600">
                    By leveraging artificial intelligence to predict exam questions and create personalized 
                    study plans, we help students achieve better grades while spending less time on 
                    ineffective studying.
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
                >
                  <h3 className="text-2xl font-bold mb-4">Our Values</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                      <span><strong>Student-First:</strong> Every decision we make prioritizes student success and academic achievement.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                      <span><strong>AI-Powered Intelligence:</strong> We harness cutting-edge AI to make studying smarter, not harder.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                      <span><strong>Community Building:</strong> We foster collaborative learning environments where students help each other succeed.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                      <span><strong>Academic Excellence:</strong> We're committed to helping students achieve their highest academic potential.</span>
                    </li>
                  </ul>
                </motion.div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mb-16"
              >
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                  <p className="text-gray-600 mb-4">
                    CramIntel was born from a simple observation: West African university students were 
                    drowning in information overload. With massive course materials, unclear exam expectations, 
                    and limited study time, too many brilliant students were struggling to achieve their potential.
                  </p>
                  <p className="text-gray-600 mb-4">
                    In 2023, our founder began researching this challenge during his own university years, 
                    recognizing that the problem wasn't a lack of intelligence or effort—it was a lack of 
                    direction. Students needed to know what to study, not just how to study.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Throughout 2024, we assembled a team of AI engineers, education specialists, and former students 
                    who understood the unique challenges of West African universities. We developed and refined our 
                    proprietary exam prediction algorithm that analyzes lecture patterns, past questions, 
                    and assignment trends to predict what's most likely to appear on exams.
                  </p>
                  <p className="text-gray-600">
                    After extensive beta testing with select student groups and achieving remarkable results, 
                    we're excited to officially launch CramIntel in 2025. We're preparing to serve thousands 
                    of students across multiple universities, helping them achieve better grades while reducing 
                    study stress. Our AI continues to learn and improve with each interaction.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mb-16"
              >
                <h2 className="text-3xl font-bold mb-6">Meet Our Team</h2>
                <p className="text-gray-600 mb-8">
                  Our diverse team combines expertise in artificial intelligence, education technology, 
                  and deep understanding of West African university systems to deliver solutions that 
                  truly work for students.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      name: "John Smith",
                      role: "Founder & CEO",
                      bio: "University student who experienced the academic challenges firsthand. Now leading CramIntel's mission to transform student success.",
                      image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=300&h=300"
                    },
                    {
                      name: "Jane Doe",
                      role: "AI/ML Engineer",
                      bio: "PhD in Machine Learning, specializing in educational AI and predictive algorithms for academic success.",
                      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=300&h=300"
                    },
                    {
                      name: "Michael Johnson",
                      role: "Education Specialist",
                      bio: "Former university lecturer with 10+ years experience in West African higher education systems and curriculum design.",
                      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&h=300"
                    },
                    {
                      name: "Sarah Wilson",
                      role: "Student Success Manager",
                      bio: "Psychology graduate focused on learning optimization and student support. Ensures our tools truly help students succeed.",
                      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=300&h=300"
                    }
                  ].map((member, i) => (
                    <Card key={i} className="bg-gray-50 border border-gray-100 overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-32 h-32 relative mb-4 rounded-full overflow-hidden">
                            <img 
                              src={member.image} 
                              alt={member.name} 
                              className="w-full h-full object-cover filter grayscale" 
                            />
                          </div>
                          <h3 className="font-bold text-lg">{member.name}</h3>
                          <p className="text-blue-600 text-sm mb-2 font-medium">{member.role}</p>
                          <p className="text-gray-600 text-sm">{member.bio}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* Student Testimonial Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mb-16"
              >
                <h2 className="text-3xl font-bold mb-6">What Students Say</h2>
                <div className="bg-blue-50 rounded-xl p-8 border border-blue-100">
                  <blockquote className="text-lg text-gray-700 italic mb-4">
                    "CramIntel completely changed how I approach studying. Instead of reading everything, 
                    I focus on what their AI predicts will be on the exam. My GPA went from 2.1 to 3.6 
                    in just two semesters!"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mr-4">
                      <span className="text-blue-600 font-bold">AO</span>
                    </div>
                    <div>
                      <p className="font-semibold">Ama Owusu</p>
                      <p className="text-gray-600 text-sm">Business Administration, University of Ghana</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-16 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/student-dashboard" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all group">
                  Join Our Launch Community
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/study-guides" className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all group">
                  Get Early Access
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;

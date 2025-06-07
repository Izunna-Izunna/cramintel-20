import { useEffect, useRef, useState } from 'react';
import { Upload, Brain, BookOpen, Users, ArrowRight, FileText, Zap, CheckCircle, MessageSquare, Target, Trophy, Clock } from "lucide-react";
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from "@/components/ui/button";
import { useScrollHijack } from '@/hooks/useScrollHijack';

const Features = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const hijackSectionRef = useRef<HTMLDivElement>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const features = [
    {
      icon: <Upload className="w-10 h-10 text-white transition-transform duration-300 transform" />,
      title: "Upload & Analyze",
      description: "Upload your notes, past questions, and assignments. Our AI instantly analyzes and organizes your study materials for optimal learning.",
      image: "/lovable-uploads/48e540e5-6a25-44e4-b3f7-80f3bfc2777a.png"
    },
    {
      icon: <Brain className="w-10 h-10 text-white transition-transform duration-300 transform" />,
      title: "AI Exam Predictions",
      description: "Get intelligent predictions of likely exam questions based on your course materials, past papers, and lecturer patterns.",
      image: "/lovable-uploads/48ecf6e2-5a98-4a9d-af6f-ae2265cd4098.png"
    },
    {
      icon: <BookOpen className="w-10 h-10 text-white transition-transform duration-300 transform" />,
      title: "Smart Study Tools",
      description: "Auto-generated flashcards, quizzes, and interactive study materials created from your uploaded content for effective learning.",
      image: "/lovable-uploads/d16ff71b-47a0-45da-91f8-31ea55ef55ba.png"
    },
    {
      icon: <Users className="w-10 h-10 text-white transition-transform duration-300 transform" />,
      title: "Study Communities",
      description: "Join course-specific study circles, collaborate with peers, and share insights for better exam preparation.",
      image: "/lovable-uploads/6739bd63-bf19-4abd-bb23-0b613bbf7ac8.png"
    }
  ];

  const { isHijacked, currentIndex } = useScrollHijack(hijackSectionRef, features.length);

  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-in');
          (entry.target as HTMLElement).style.opacity = '1';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });
    if (featuresRef.current) {
      const elements = featuresRef.current.querySelectorAll('.feature-item');
      elements.forEach(el => {
        if (!el.classList.contains('animate-slide-in')) {
          (el as HTMLElement).style.opacity = '0';
          observer.observe(el);
        }
      });
    }
    return () => observer.disconnect();
  }, []);

  const studyProcessSteps = [
    {
      icon: <Upload className="h-8 w-8 text-blue-600" />,
      title: "Upload Materials",
      description: "Upload notes, past questions, and course materials",
      detail: "PDFs, images, documents - we handle all formats"
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-600" />,
      title: "AI Analysis",
      description: "Our AI analyzes patterns and key concepts",
      detail: "Advanced algorithms identify important topics and trends"
    },
    {
      icon: <Target className="h-8 w-8 text-green-600" />,
      title: "Get Predictions",
      description: "Receive likely exam questions and focus areas",
      detail: "Confidence ratings help you prioritize study time"
    },
    {
      icon: <BookOpen className="h-8 w-8 text-orange-600" />,
      title: "Study Smart",
      description: "Use generated flashcards and practice tests",
      detail: "Interactive tools adapt to your learning pace"
    }
  ];

  const studentBenefits = [
    {
      icon: <Clock className="h-6 w-6 text-green-600" />,
      title: "Save 40% Study Time",
      description: "Focus on what's most likely to appear in exams"
    },
    {
      icon: <Trophy className="h-6 w-6 text-blue-600" />,
      title: "Higher Grades",
      description: "Students report average 15% grade improvement"
    },
    {
      icon: <Zap className="h-6 w-6 text-purple-600" />,
      title: "Instant Insights",
      description: "Get AI-powered study recommendations in seconds"
    }
  ];

  return <>
      <section id="features" className="relative bg-white overflow-hidden py-10 md:py-[50px] w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8" ref={featuresRef}> 
          <div className="text-center mb-10 max-w-3xl mx-auto feature-item">
            <div className="inline-block mb-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              Smart Learning Platform
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Everything You Need to Excel
            </h2>
            <p className="text-gray-600 mt-4">
              CramIntel combines AI-powered predictions with smart study tools to help you learn more effectively and perform better in exams.
            </p>
          </div>
          
          {/* Scroll-hijacked features section */}
          <div 
            ref={hijackSectionRef}
            className={cn(
              "relative transition-all duration-500",
              isHijacked ? "fixed inset-0 z-50 bg-black" : "grid grid-cols-1 md:grid-cols-2 gap-5"
            )}
            style={{ height: isHijacked ? '100vh' : 'auto' }}
          >
            {isHijacked && (
              <div className="absolute top-4 right-4 z-10 text-white text-sm opacity-70">
                {currentIndex + 1} / {features.length}
              </div>
            )}
            
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={cn(
                  "feature-item rounded-xl overflow-hidden transform transition-all duration-500 relative shadow-lg",
                  isHijacked 
                    ? cn(
                        "absolute inset-0 w-full h-full",
                        index === currentIndex 
                          ? "opacity-100 translate-x-0" 
                          : index < currentIndex 
                            ? "opacity-0 -translate-x-full" 
                            : "opacity-0 translate-x-full"
                      )
                    : "hover:-translate-y-1 h-[280px]"
                )}
                style={{
                  transitionDelay: isHijacked ? '0ms' : `${index * 100}ms`
                }}
                onMouseEnter={() => !isHijacked && setHoveredFeature(index)} 
                onMouseLeave={() => !isHijacked && setHoveredFeature(null)}
              >
                <div className="absolute inset-0 w-full h-full">
                  <img 
                    src={feature.image} 
                    alt={feature.title} 
                    className={cn(
                      "w-full h-full object-cover transition-all duration-300",
                      isHijacked ? "grayscale-0" : "grayscale"
                    )} 
                  />
                  <div className={cn(
                    "absolute inset-0 transition-opacity duration-300",
                    isHijacked 
                      ? "bg-black/40" 
                      : hoveredFeature === index 
                        ? "bg-black/50" 
                        : "bg-black/70"
                  )}></div>
                </div>
                
                <div className={cn(
                  "relative z-10 flex flex-col justify-center",
                  isHijacked 
                    ? "p-16 h-full text-center items-center" 
                    : "p-6 h-full justify-between"
                )}>
                  <div className={isHijacked ? "space-y-8" : ""}>
                    <div className={cn(
                      "inline-block p-3 bg-gray-800/40 backdrop-blur-sm rounded-lg transition-all duration-300 transform",
                      isHijacked 
                        ? "mb-6 scale-150" 
                        : hoveredFeature === index 
                          ? "mb-4 hover:scale-110" 
                          : "mb-4"
                    )}>
                      <div className={`transform transition-transform duration-300 ${!isHijacked && hoveredFeature === index ? 'rotate-12' : ''}`}>
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className={cn(
                      "font-semibold text-white",
                      isHijacked ? "text-4xl mb-6" : "text-xl mb-2"
                    )}>
                      {feature.title}
                    </h3>
                    <p className={cn(
                      "text-white/90",
                      isHijacked ? "text-lg max-w-2xl" : "text-sm"
                    )}>
                      {feature.description}
                    </p>
                  </div>
                  {!isHijacked && (
                    <div className={`h-0.5 bg-white/70 mt-3 transition-all duration-500 ${hoveredFeature === index ? 'w-full' : 'w-0'}`}></div>
                  )}
                </div>
              </div>
            ))}
            
            {isHijacked && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center">
                <div className="flex space-x-2 mb-4">
                  {features.map((_, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        index === currentIndex ? "bg-white w-8" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm opacity-70">
                  {isMobile ? "Swipe" : "Scroll"} to continue • Press ESC to exit
                </p>
              </div>
            )}
          </div>

          <div className="mt-16 mb-8 feature-item">
            <div className="text-center mb-8">
              <div className="inline-block mb-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                How It Works
              </div>
              <h3 className="text-2xl font-bold">Your Path to Smarter Studying</h3>
              <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
                From upload to exam success - see how CramIntel transforms your study materials into powerful learning tools.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 feature-item border border-gray-100 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {studyProcessSteps.map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <h4 className="font-semibold text-lg mb-2">{step.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                    <p className="text-gray-500 text-xs">{step.detail}</p>
                    {index < studyProcessSteps.length - 1 && (
                      <div className="hidden md:block absolute top-8 right-0 transform translate-x-1/2">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 feature-item">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Why Students Choose CramIntel</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studentBenefits.map((benefit, index) => (
                <Card key={index} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="bg-gray-50 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      {benefit.icon}
                    </div>
                    <h4 className="font-semibold text-lg mb-2">{benefit.title}</h4>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-center mt-12 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button onClick={scrollToContact} className="inline-flex items-center px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all group w-full sm:w-auto">
            Start Learning Smarter
            <MessageSquare className="ml-2 w-4 h-4 group-hover:animate-pulse" />
          </Button>
          
          <Button onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center px-4 sm:px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all group w-full sm:w-auto">
            See How It Works
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>
    </>;
};
export default Features;

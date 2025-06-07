
import { useState, useRef, useEffect, TouchEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronLeft, ChevronRight, Star, TrendingUp, Award, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";

const successStories = [
  {
    id: 1,
    name: "Adaora Okafor",
    university: "University of Lagos",
    course: "Computer Science",
    improvement: "Grade increased from C+ to A-",
    story: "Using CramIntel's AI predictions, I identified the most likely exam questions and focused my study time effectively. The flashcards feature helped me memorize key concepts faster than ever before.",
    metrics: { gradeImprovement: "85%", studyTimeReduced: "40%", examScore: "88%" },
    imageUrl: "/lovable-uploads/93ab0638-8190-4ccf-897f-21fda7f4f5ad.png",
    isFeatured: true,
    testimonial: "CramIntel completely changed how I study. I went from struggling with exams to consistently getting top grades in my class.",
    coursesUsed: ["Data Structures", "Algorithms", "Software Engineering"]
  },
  {
    id: 2,
    name: "Kwame Asante",
    university: "University of Ghana",
    course: "Business Administration",
    improvement: "Reduced study time by 50%",
    story: "The AI exam predictions were incredibly accurate. I spent less time studying but achieved better results by focusing on the right topics.",
    metrics: { gradeImprovement: "75%", studyTimeReduced: "50%", examScore: "82%" },
    imageUrl: "/lovable-uploads/b0622048-17b4-4c75-a3f0-6c9e17de1d09.png",
    testimonial: "I couldn't believe how accurate the predictions were. Almost 80% of my exam questions were predicted by CramIntel.",
    coursesUsed: ["Marketing", "Finance", "Operations Management"]
  },
  {
    id: 3,
    name: "Fatima Ibrahim",
    university: "Ahmadu Bello University",
    course: "Medicine",
    improvement: "Top 5% of class",
    story: "Medical school is intense, but CramIntel's study communities connected me with peers who shared valuable insights. The AI-generated flashcards made memorizing complex medical terms manageable.",
    metrics: { gradeImprovement: "90%", studyTimeReduced: "35%", examScore: "91%" },
    imageUrl: "/lovable-uploads/6b0637e9-4a7b-40d0-b219-c8b7f879f93e.png",
    testimonial: "The study communities feature is a game-changer. Collaborating with classmates through CramIntel helped us all improve together.",
    coursesUsed: ["Anatomy", "Physiology", "Pharmacology"]
  },
  {
    id: 4,
    name: "Emmanuel Osei",
    university: "KNUST",
    course: "Engineering",
    improvement: "First Class Honours",
    story: "CramIntel's document analysis feature helped me understand complex engineering concepts by breaking them down into digestible flashcards and practice questions.",
    metrics: { gradeImprovement: "80%", studyTimeReduced: "45%", examScore: "86%" },
    imageUrl: "/lovable-uploads/c30e0487-2fa0-41d1-9a0b-699cb2855388.png",
    testimonial: "The way CramIntel analyzes my notes and creates study materials is like having a personal tutor available 24/7.",
    coursesUsed: ["Thermodynamics", "Fluid Mechanics", "Control Systems"]
  },
  {
    id: 5,
    name: "Amina Hassan",
    university: "University of Ilorin",
    course: "Law",
    improvement: "Bar exam success",
    story: "Preparing for law exams requires memorizing vast amounts of case studies and statutes. CramIntel's AI helped me identify the most important cases and create effective study schedules.",
    metrics: { gradeImprovement: "78%", studyTimeReduced: "42%", examScore: "84%" },
    imageUrl: "/lovable-uploads/d5ce901e-2ce0-4f2a-bce1-f0ca5d6192df.png",
    testimonial: "CramIntel made law school manageable. The predictions helped me focus on cases that actually appeared in exams.",
    coursesUsed: ["Constitutional Law", "Criminal Law", "Contract Law"]
  }
];

const Projects = () => {
  const [activeStory, setActiveStory] = useState(0);
  const storiesRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const minSwipeDistance = 50;

  useEffect(() => {
    if (isInView && !isHovering) {
      const interval = setInterval(() => {
        setActiveStory(prev => (prev + 1) % successStories.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isInView, isHovering]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setIsInView(true);
      } else {
        setIsInView(false);
      }
    }, {
      threshold: 0.2
    });
    
    if (storiesRef.current) {
      observer.observe(storiesRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setActiveStory(prev => (prev + 1) % successStories.length);
    } else if (isRightSwipe) {
      setActiveStory(prev => (prev - 1 + successStories.length) % successStories.length);
    }
  };

  const getCardAnimationClass = (index: number) => {
    if (index === activeStory) return "scale-100 opacity-100 z-20";
    if (index === (activeStory + 1) % successStories.length) return "translate-x-[40%] scale-95 opacity-60 z-10";
    if (index === (activeStory - 1 + successStories.length) % successStories.length) return "translate-x-[-40%] scale-95 opacity-60 z-10";
    return "scale-90 opacity-0";
  };
  
  return <section id="projects" ref={storiesRef} className="bg-white py-[50px] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`text-center mb-10 max-w-3xl mx-auto transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-block mb-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            Student Success Stories
          </div>
          <h2 className="text-3xl font-bold mb-3">
            Real Students, Real Results
          </h2>
          <p className="text-gray-600">
            Discover how West African university students are achieving academic success with CramIntel's AI-powered study tools and exam predictions.
          </p>
          {isMobile && (
            <div className="flex items-center justify-center mt-4 animate-pulse-slow">
              <div className="flex items-center text-blue-500">
                <ChevronLeft size={16} />
                <p className="text-sm mx-1">Swipe to navigate</p>
                <ChevronRight size={16} />
              </div>
            </div>
          )}
        </div>
        
        <div 
          className="relative h-[550px] overflow-hidden" 
          onMouseEnter={() => setIsHovering(true)} 
          onMouseLeave={() => setIsHovering(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          ref={carouselRef}
        >
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            {successStories.map((story, index) => (
              <div 
                key={story.id} 
                className={`absolute top-0 w-full max-w-md transform transition-all duration-500 ${getCardAnimationClass(index)}`} 
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <Card className="overflow-hidden h-[500px] border border-gray-100 shadow-sm hover:shadow-md flex flex-col">
                  <div 
                    className="relative bg-black p-6 flex items-center justify-center h-48 overflow-hidden"
                    style={{
                      backgroundImage: `url(${story.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-black/50"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                      <h3 className="text-2xl font-bold text-white mb-1">{story.name}</h3>
                      <p className="text-white/90 text-sm mb-1">{story.university}</p>
                      <p className="text-white/80 text-sm">{story.course}</p>
                      <div className="flex items-center mt-2">
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">{story.improvement}</span>
                      </div>
                    </div>
                    
                    <blockquote className="text-gray-600 text-sm mb-4 flex-grow italic">
                      "{story.testimonial}"
                    </blockquote>
                    
                    <div className="mt-auto">
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-lg font-bold text-gray-800">{story.metrics.gradeImprovement}</div>
                          <div className="text-xs text-gray-500">Grade Boost</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-lg font-bold text-gray-800">{story.metrics.studyTimeReduced}</div>
                          <div className="text-xs text-gray-500">Time Saved</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-lg font-bold text-gray-800">{story.metrics.examScore}</div>
                          <div className="text-xs text-gray-500">Exam Score</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {story.coursesUsed.slice(0,2).map((course, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs"
                          >
                            {course}
                          </span>
                        ))}
                        {story.coursesUsed.length > 2 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-full text-xs">
                            +{story.coursesUsed.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          
          {!isMobile && (
            <>
              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-gray-500 hover:bg-white z-30 shadow-md transition-all duration-300 hover:scale-110" 
                onClick={() => setActiveStory(prev => (prev - 1 + successStories.length) % successStories.length)}
                aria-label="Previous story"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-gray-500 hover:bg-white z-30 shadow-md transition-all duration-300 hover:scale-110" 
                onClick={() => setActiveStory(prev => (prev + 1) % successStories.length)}
                aria-label="Next story"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center space-x-3 z-30">
            {successStories.map((_, idx) => (
              <button 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeStory === idx ? 'bg-gray-500 w-5' : 'bg-gray-200 hover:bg-gray-300'}`} 
                onClick={() => setActiveStory(idx)}
                aria-label={`Go to story ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">5,000+</div>
              <div className="text-sm text-gray-600">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">85%</div>
              <div className="text-sm text-gray-600">Grade Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">12</div>
              <div className="text-sm text-gray-600">Universities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">40%</div>
              <div className="text-sm text-gray-600">Time Saved</div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};

export default Projects;


import { MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FloatingContactButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  
  // Show the button after scrolling down a bit
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if user has already been onboarded
    const userData = localStorage.getItem('cramIntelUser');
    
    if (userData) {
      // User is already onboarded, scroll to contact
      const contactSection = document.getElementById('contact-info');
      if (contactSection) {
        contactSection.scrollIntoView({
          behavior: 'smooth'
        });
      }
    } else {
      // User not onboarded, redirect to onboarding
      navigate('/onboarding');
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
      size="icon"
      aria-label="Get Started or Contact Us"
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
};

export default FloatingContactButton;


import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X, ChevronDown, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CramIntelLogo from '@/components/CramIntelLogo';
import { useAuth } from '@/hooks/useAuth';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (id: string) => {
    // If not on home page, navigate to home first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
    setIsMenuOpen(false);
  };

  const handleGetStarted = () => {
    navigate('/onboarding');
    setIsMenuOpen(false);
  };

  const handleSignIn = () => {
    navigate('/auth');
    setIsMenuOpen(false);
  };

  const handleDashboard = () => {
    navigate('/dashboard');
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <motion.nav className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full", isScrolled ? "bg-white shadow-sm" : "bg-black")} initial={{
      opacity: 1,
      y: 0
    }} animate={{
      opacity: 1,
      y: 0
    }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <CramIntelLogo 
                variant={isScrolled ? "dark" : "light"} 
                size="md"
                className="transition-all duration-300"
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavigationMenu className={cn(isScrolled ? "" : "text-white")}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), isScrolled ? "text-gray-700 hover:text-gray-900" : "text-gray-100 hover:text-white bg-transparent hover:bg-gray-800")} asChild>
                    <Link to="/">Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), isScrolled ? "text-gray-700 hover:text-gray-900" : "text-gray-100 hover:text-white bg-transparent hover:bg-gray-800")} asChild>
                    <Link to="/about">About</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(isScrolled ? "text-gray-700 hover:text-gray-900" : "text-gray-100 hover:text-white bg-transparent hover:bg-gray-800")}>
                    Success Stories
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px]">
                      <li>
                        <button onClick={() => scrollToSection('projects')} className="block p-3 space-y-1 rounded-md hover:bg-gray-100 w-full text-left">
                          <div className="font-medium">Student Achievements</div>
                          <p className="text-sm text-gray-500">Real stories from successful students</p>
                        </button>
                      </li>
                      <li>
                        <button onClick={() => scrollToSection('features')} className="block p-3 space-y-1 rounded-md hover:bg-gray-100 w-full text-left">
                          <div className="font-medium">Grade Improvements</div>
                          <p className="text-sm text-gray-500">How students boosted their academic performance</p>
                        </button>
                      </li>
                      <li>
                        <button onClick={() => scrollToSection('why-cramintel')} className="block p-3 space-y-1 rounded-md hover:bg-gray-100 w-full text-left">
                          <div className="font-medium">Study Efficiency</div>
                          <p className="text-sm text-gray-500">Time saved with smart learning approaches</p>
                        </button>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(isScrolled ? "text-gray-700 hover:text-gray-900" : "text-gray-100 hover:text-white bg-transparent hover:bg-gray-800")}>
                    How It Works
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px]">
                      <li>
                        <button onClick={() => scrollToSection('features')} className="block p-3 space-y-1 rounded-md hover:bg-gray-100 w-full text-left">
                          <div className="font-medium">AI Predictions</div>
                          <p className="text-sm text-gray-500">How our AI analyzes and predicts exam questions</p>
                        </button>
                      </li>
                      <li>
                        <button onClick={() => scrollToSection('features')} className="block p-3 space-y-1 rounded-md hover:bg-gray-100 w-full text-left">
                          <div className="font-medium">Study Process</div>
                          <p className="text-sm text-gray-500">Our step-by-step approach to smarter learning</p>
                        </button>
                      </li>
                      <li>
                        <button onClick={() => scrollToSection('why-cramintel')} className="block p-3 space-y-1 rounded-md hover:bg-gray-100 w-full text-left">
                          <div className="font-medium">Smart Tools</div>
                          <p className="text-sm text-gray-500">Flashcards, quizzes, and study communities</p>
                        </button>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), isScrolled ? "text-gray-700 hover:text-gray-900" : "text-gray-100 hover:text-white bg-transparent hover:bg-gray-800")} asChild>
                    <Link to="/blog">Blog</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                {/* Authentication-aware navigation */}
                {user ? (
                  <>
                    <NavigationMenuItem>
                      <button onClick={handleDashboard} className={cn("px-4 py-2 rounded-md transition-colors mr-3", isScrolled ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-700 text-white hover:bg-gray-600")}>
                        Dashboard
                      </button>
                    </NavigationMenuItem>
                    
                    <NavigationMenuItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn("flex items-center gap-2 px-3 py-2 rounded-md transition-colors", isScrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-gray-800")}>
                          <User className="w-4 h-4" />
                          <ChevronDown className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={handleDashboard}>
                            <User className="w-4 h-4 mr-2" />
                            Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleSignOut}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </NavigationMenuItem>
                  </>
                ) : (
                  <>
                    <NavigationMenuItem>
                      <button onClick={handleSignIn} className={cn("px-4 py-2 rounded-md transition-colors mr-3", isScrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-gray-800")}>
                        Sign In
                      </button>
                    </NavigationMenuItem>
                    
                    <NavigationMenuItem>
                      <button onClick={handleGetStarted} className={cn("px-4 py-2 rounded-md transition-colors", isScrolled ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-700 text-white hover:bg-gray-600")}>
                        Get Started
                      </button>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className={cn("focus:outline-none", isScrolled ? "text-gray-700" : "text-white")}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={cn("md:hidden transition-all duration-300 overflow-hidden w-full", isMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
        <div className={cn("px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-sm", isScrolled ? "bg-white" : "bg-black")}>
          <Link to="/" className={cn("block px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")} onClick={() => {
            setIsMenuOpen(false);
            window.scrollTo(0, 0);
          }}>
            Home
          </Link>
          
          <Link to="/about" className={cn("block px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")} onClick={() => {
            setIsMenuOpen(false);
            window.scrollTo(0, 0);
          }}>
            About
          </Link>
          
          <div className="block">
            <button onClick={e => {
              e.preventDefault();
              const submenu = e.currentTarget.nextElementSibling;
              if (submenu) {
                submenu.classList.toggle('hidden');
              }
            }} className={cn("flex w-full justify-between items-center px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")}>
              <span>Success Stories</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            <div className="hidden ml-4 mt-1 space-y-1">
              <button onClick={() => scrollToSection('projects')} className={cn("block w-full text-left px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")}>
                Student Achievements
              </button>
              <button onClick={() => scrollToSection('features')} className={cn("block w-full text-left px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")}>
                Grade Improvements
              </button>
            </div>
          </div>
          
          <div className="block">
            <button onClick={e => {
              e.preventDefault();
              const submenu = e.currentTarget.nextElementSibling;
              if (submenu) {
                submenu.classList.toggle('hidden');
              }
            }} className={cn("flex w-full justify-between items-center px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")}>
              <span>How It Works</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            <div className="hidden ml-4 mt-1 space-y-1">
              <button onClick={() => scrollToSection('features')} className={cn("block w-full text-left px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")}>
                AI Predictions
              </button>
              <button onClick={() => scrollToSection('features')} className={cn("block w-full text-left px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")}>
                Study Process
              </button>
              <button onClick={() => scrollToSection('why-cramintel')} className={cn("block w-full text-left px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")}>
                Why CramIntel
              </button>
            </div>
          </div>
          
          <Link to="/blog" className={cn("block px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")} onClick={() => {
            setIsMenuOpen(false);
            window.scrollTo(0, 0);
          }}>
            Blog
          </Link>
          
          {/* Mobile authentication buttons */}
          {user ? (
            <>
              <button onClick={handleDashboard} className={cn("block w-full text-left px-3 py-2 rounded-md", isScrolled ? "text-gray-700 bg-gray-200 hover:bg-gray-300" : "text-white bg-gray-700 hover:bg-gray-600")}>
                Dashboard
              </button>
              <button onClick={handleSignOut} className={cn("block w-full text-left px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSignIn} className={cn("block w-full text-left px-3 py-2 rounded-md", isScrolled ? "text-gray-700 hover:bg-gray-50" : "text-gray-200 hover:bg-gray-900")}>
                Sign In
              </button>
              <button onClick={handleGetStarted} className={cn("block w-full text-left px-3 py-2 rounded-md", isScrolled ? "text-gray-700 bg-gray-200 hover:bg-gray-300" : "text-white bg-gray-700 hover:bg-gray-600")}>
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

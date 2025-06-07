
import PageLayout from '@/components/PageLayout';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Projects from '@/components/Projects';
import WhyCramIntel from '@/components/WhyCramIntel';
import Pricing from '@/components/Pricing';
import BlogPreview from '@/components/BlogPreview';
import SEO from '@/components/SEO';
import { useEffect } from 'react';

const Index = () => {
  // Fix any ID conflicts when the page loads
  useEffect(() => {
    const contactElements = document.querySelectorAll('[id="contact"]');
    if (contactElements.length > 1) {
      // If there are multiple elements with id="contact", rename one
      contactElements[1].id = 'contact-footer';
    }
  }, []);

  return (
    <PageLayout>
      <SEO 
        title="CramIntel - Smart Exam Prediction & Learning Tool" 
        description="CramIntel helps West African university students learn smarter with AI-powered exam predictions, flashcards, and study tools. Cut the noise. Learn what counts."
        imageUrl="/lovable-uploads/526dc38a-25fa-40d4-b520-425b23ae0464.png"
        keywords={['exam predictions', 'study tools', 'AI learning', 'flashcards', 'university students', 'West Africa', 'smart learning', 'exam prep']}
      />
      <Hero />
      <Features />
      <WhyCramIntel />
      <Pricing />
      <Projects />
      <BlogPreview />
    </PageLayout>
  );
};

export default Index;

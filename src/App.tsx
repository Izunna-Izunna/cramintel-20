
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import Index from './pages/Index';
import About from './pages/About';
import Auth from './pages/Auth';
import Blog from './pages/Blog';
import BlogPostDetail from './pages/BlogPostDetail';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import PrivacyPolicy from './pages/PrivacyPolicy';
import StudentSupport from './pages/StudentSupport';
import TermsOfService from './pages/TermsOfService';
import TestPdfExtraction from './pages/TestPdfExtraction';
import TestPredictions from './pages/TestPredictions';
import TextExtractionTest from './pages/TextExtractionTest';
import GoogleVisionTest from './pages/GoogleVisionTest';
import Waitlist from './pages/Waitlist';
import ProtectedRoute from './components/ProtectedRoute';
import SEO from './components/SEO';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <SEO />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostDetail />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/support" element={<StudentSupport />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/test-pdf" element={<TestPdfExtraction />} />
              <Route path="/test-extraction" element={<TextExtractionTest />} />
              <Route path="/google-vision-test" element={<GoogleVisionTest />} />
              <Route path="/test-predictions" element={<ProtectedRoute><TestPredictions /></ProtectedRoute>} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;

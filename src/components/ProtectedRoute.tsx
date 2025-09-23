
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Code } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  // Development bypass - can be disabled by setting VITE_BYPASS_AUTH=false
  const isDevelopment = import.meta.env.DEV;
  const bypassAuth = isDevelopment && import.meta.env.VITE_BYPASS_AUTH !== 'false';

  // Create mock user data for development
  if (bypassAuth) {
    // Store mock user data in localStorage for dashboard components
    const mockUser = {
      firstName: 'Sarah',
      lastName: 'Chen', 
      email: 'sarah.chen@mit.edu',
      school: 'Massachusetts Institute of Technology',
      department: 'Computer Science & Engineering',
      courses: ['Data Structures & Algorithms', 'Machine Learning', 'Computer Networks', 'Database Systems']
    };
    
    if (!localStorage.getItem('cramIntelUser')) {
      localStorage.setItem('cramIntelUser', JSON.stringify(mockUser));
    }

    return (
      <>
        {import.meta.env.VITE_USE_MOCK_DATA === 'true' && (
          <Alert className="fixed top-4 right-4 z-50 w-auto bg-blue-50 border-blue-200">
            <Code className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 font-medium">
              DEMO MODE - Mock Data Active
            </AlertDescription>
          </Alert>
        )}
        {!import.meta.env.VITE_USE_MOCK_DATA && (
          <Alert className="fixed top-4 left-4 z-50 w-auto bg-yellow-50 border-yellow-200">
            <Code className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 font-medium">
              Development Mode - Auth Bypassed
            </AlertDescription>
          </Alert>
        )}
        {children}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

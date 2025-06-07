
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('cramIntelUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('cramIntelUser');
    navigate('/');
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-900"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome back, {userData.name}! 👋
          </motion.h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            className="bg-white p-6 rounded-lg shadow-sm border"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-2">Your Profile</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>School:</strong> {userData.school}</p>
              <p><strong>Department:</strong> {userData.department}</p>
              <p><strong>Study Style:</strong> {userData.studyStyle}</p>
            </div>
          </motion.div>

          <motion.div
            className="bg-white p-6 rounded-lg shadow-sm border"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-2">Your Courses</h3>
            <div className="flex flex-wrap gap-2">
              {userData.courses?.map((course: string, index: number) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                >
                  {course}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="bg-white p-6 rounded-lg shadow-sm border"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ready to {userData.firstAction === 'upload' ? 'upload your first past question' :
                      userData.firstAction === 'summarize' ? 'summarize your notes' :
                      userData.firstAction === 'predict' ? 'get exam predictions' :
                      'explore the platform'}?
            </p>
            <Button className="w-full bg-gray-800 hover:bg-gray-700">
              {userData.firstAction === 'upload' ? 'Upload Past Question' :
               userData.firstAction === 'summarize' ? 'Upload Notes' :
               userData.firstAction === 'predict' ? 'Get Predictions' :
               'Start Exploring'}
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="mt-8 bg-white p-6 rounded-lg shadow-sm border"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-semibold mb-4">Dashboard Coming Soon 🚀</h3>
          <p className="text-gray-600">
            Your personalized study dashboard is being built! Soon you'll have access to:
          </p>
          <ul className="mt-4 space-y-2 text-gray-600">
            <li>• AI-powered exam predictions</li>
            <li>• Smart flashcard generation</li>
            <li>• Study progress tracking</li>
            <li>• Course-specific study groups</li>
            <li>• Personalized study recommendations</li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;

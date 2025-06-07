import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import PageLayout from '@/components/PageLayout';

const PrivacyPolicy = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageLayout>
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">Last updated: June 7, 2025</p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                At CramIntel ("we," "our," or "us"), we are committed to protecting the privacy and security of our student users. This Privacy Policy explains how we collect, use, process, and safeguard your personal information when you use our AI-powered study platform and related services.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium mt-6 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-600 mb-4">
                We collect personal information that you voluntarily provide when you:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Create an account (name, email address, university, department)</li>
                <li>Upload study materials, course content, or exam documents</li>
                <li>Use our AI prediction and analysis features</li>
                <li>Participate in study communities or discussions</li>
                <li>Contact our student support team</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">2.2 Academic and Study Data</h3>
              <p className="text-gray-600 mb-4">
                To provide our AI-powered study assistance, we collect and process:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Course materials, lecture notes, and study documents you upload</li>
                <li>Practice exam responses and study session data</li>
                <li>Learning progress, study patterns, and performance analytics</li>
                <li>Flashcard interactions and quiz responses</li>
                <li>Study preferences and learning style assessments</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">2.3 Technical Information</h3>
              <p className="text-gray-600 mb-4">
                We automatically collect certain technical information including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Device information, browser type, and operating system</li>
                <li>IP address and general location information</li>
                <li>Usage patterns, feature interactions, and session data</li>
                <li>Error reports and performance analytics</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
              <h3 className="text-xl font-medium mt-6 mb-3">3.1 AI-Powered Study Features</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Generate personalized exam predictions based on your study materials</li>
                <li>Create adaptive flashcards and practice questions</li>
                <li>Provide intelligent study recommendations and scheduling</li>
                <li>Analyze learning patterns to optimize study efficiency</li>
                <li>Generate AI-powered study summaries and notes</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">3.2 Platform Services</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Maintain and improve our educational platform</li>
                <li>Provide customer support and technical assistance</li>
                <li>Send important updates about your account and studies</li>
                <li>Facilitate study groups and peer learning opportunities</li>
                <li>Ensure platform security and prevent academic misconduct</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Sharing and Disclosure</h2>
              <h3 className="text-xl font-medium mt-6 mb-3">4.1 We Do Not Sell Your Data</h3>
              <p className="text-gray-600 mb-4">
                We never sell, rent, or trade your personal information or study data to third parties for commercial purposes.
              </p>
              
              <h3 className="text-xl font-medium mt-6 mb-3">4.2 Limited Sharing</h3>
              <p className="text-gray-600 mb-4">
                We may share anonymized, aggregated data with educational institutions to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Improve curriculum design and teaching methods</li>
                <li>Provide insights on student learning patterns</li>
                <li>Support educational research (with proper anonymization)</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">4.3 Service Providers</h3>
              <p className="text-gray-600 mb-4">
                We work with trusted service providers who help us operate our platform, including cloud storage, AI processing, and analytics services. These providers are bound by strict confidentiality agreements.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Student Rights</h2>
              <p className="text-gray-600 mb-4">
                As a student user, you have the following rights regarding your data:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li><strong>Access:</strong> View all personal data we have about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Portability:</strong> Export your study data in a common format</li>
                <li><strong>Restriction:</strong> Limit how we process your information</li>
                <li><strong>Objection:</strong> Object to certain types of data processing</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement robust security measures to protect your academic and personal data:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>End-to-end encryption for sensitive study materials</li>
                <li>Secure cloud storage with enterprise-grade protection</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Strict access controls and employee training</li>
                <li>Compliance with international data protection standards</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Academic Integrity</h2>
              <p className="text-gray-600 mb-4">
                CramIntel is designed to enhance learning, not enable academic dishonesty. We:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Encourage proper citation and referencing practices</li>
                <li>Provide tools for legitimate study assistance only</li>
                <li>Monitor for potential misuse of our AI features</li>
                <li>Cooperate with educational institutions on integrity matters</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">8. Data Retention</h2>
              <p className="text-gray-600 mb-4">
                We retain your data only as long as necessary to provide our services:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Active accounts: Data retained while account is active</li>
                <li>Inactive accounts: Data automatically deleted after 2 years of inactivity</li>
                <li>Study materials: Retained for the duration of your academic program</li>
                <li>Analytics data: Anonymized data may be retained for service improvement</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">9. International Transfers</h2>
              <p className="text-gray-600 mb-4">
                Your data may be processed in countries outside your home country, including the United States and European Union. We ensure appropriate safeguards are in place for all international data transfers.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">10. Updates to This Policy</h2>
              <p className="text-gray-600 mb-4">
                We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of significant changes via email and through our platform. Continued use of CramIntel after updates constitutes acceptance of the revised policy.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have questions about this Privacy Policy or your data rights, please contact us:
              </p>
              <ul className="list-none mb-4 text-gray-600">
                <li><strong>Email:</strong> paschalugwuanyi98@gmail.com</li>
                <li><strong>Student Support:</strong> support@cramintel.com</li>
                <li><strong>WhatsApp:</strong> +234 7037778497</li>
                <li><strong>Address:</strong> CramIntel Technologies, Enugu, Nigeria</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default PrivacyPolicy;

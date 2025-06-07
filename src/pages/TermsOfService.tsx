
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import PageLayout from '@/components/PageLayout';

const TermsOfService = () => {
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
            
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">Last updated: June 7, 2025</p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing and using CramIntel ("the Service," "our platform"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our service.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                CramIntel is an AI-powered educational platform designed to enhance university students' learning experience through:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>AI-generated exam predictions and practice questions</li>
                <li>Intelligent flashcard creation and study scheduling</li>
                <li>Study material analysis and summarization</li>
                <li>Learning progress tracking and analytics</li>
                <li>Peer study communities and collaboration tools</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">3. Eligibility and Account Registration</h2>
              <h3 className="text-xl font-medium mt-6 mb-3">3.1 Eligibility</h3>
              <p className="text-gray-600 mb-4">
                You must be at least 16 years old and currently enrolled in or planning to attend a university or higher education institution to use CramIntel.
              </p>
              
              <h3 className="text-xl font-medium mt-6 mb-3">3.2 Account Responsibility</h3>
              <p className="text-gray-600 mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Providing accurate and complete registration information</li>
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">4. Acceptable Use Policy</h2>
              <h3 className="text-xl font-medium mt-6 mb-3">4.1 Permitted Uses</h3>
              <p className="text-gray-600 mb-4">
                You may use CramIntel to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Upload your own study materials and course content</li>
                <li>Generate practice questions for self-study</li>
                <li>Create study schedules and track learning progress</li>
                <li>Participate in study groups and academic discussions</li>
                <li>Access AI-powered study recommendations</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">4.2 Prohibited Uses</h3>
              <p className="text-gray-600 mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Use the platform to cheat on exams or assignments</li>
                <li>Upload copyrighted materials without proper authorization</li>
                <li>Share actual exam questions or leaked test materials</li>
                <li>Create multiple accounts to circumvent usage limits</li>
                <li>Attempt to reverse engineer or hack our AI systems</li>
                <li>Use the service for commercial purposes without permission</li>
                <li>Harass, bully, or intimidate other users</li>
                <li>Post inappropriate, offensive, or illegal content</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Academic Integrity</h2>
              <h3 className="text-xl font-medium mt-6 mb-3">5.1 Our Commitment</h3>
              <p className="text-gray-600 mb-4">
                CramIntel is designed to support legitimate learning and study practices. We are committed to maintaining academic integrity and will:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Provide tools that enhance understanding, not replace learning</li>
                <li>Encourage proper citation and academic honesty</li>
                <li>Cooperate with educational institutions on integrity matters</li>
                <li>Remove content that violates academic integrity policies</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">5.2 Your Responsibility</h3>
              <p className="text-gray-600 mb-4">
                You agree to use CramIntel in accordance with your institution's academic integrity policies and to take responsibility for ensuring your use complies with all applicable academic standards.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property Rights</h2>
              <h3 className="text-xl font-medium mt-6 mb-3">6.1 Your Content</h3>
              <p className="text-gray-600 mb-4">
                You retain ownership of the study materials and content you upload. By uploading content, you grant CramIntel a limited license to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Process your content through our AI systems</li>
                <li>Generate study aids and practice materials for your use</li>
                <li>Store and back up your content securely</li>
                <li>Use anonymized, aggregated data for service improvement</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">6.2 Our Content</h3>
              <p className="text-gray-600 mb-4">
                CramIntel retains all rights to our platform, AI algorithms, generated content, and proprietary technology. You may not copy, modify, or distribute our intellectual property without permission.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Subscription and Payment Terms</h2>
              <h3 className="text-xl font-medium mt-6 mb-3">7.1 Free and Premium Plans</h3>
              <p className="text-gray-600 mb-4">
                CramIntel offers both free and premium subscription plans. Premium features may include:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Unlimited AI predictions and analysis</li>
                <li>Advanced study analytics and insights</li>
                <li>Priority customer support</li>
                <li>Extended storage for study materials</li>
                <li>Collaboration tools for study groups</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">7.2 Payment and Billing</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable except as required by applicable law</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
                <li>You can cancel your subscription at any time</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">8. Service Availability</h2>
              <p className="text-gray-600 mb-4">
                While we strive to provide reliable service, we do not guarantee uninterrupted access to CramIntel. We may:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Perform scheduled maintenance with advance notice</li>
                <li>Experience temporary outages due to technical issues</li>
                <li>Modify or discontinue features with reasonable notice</li>
                <li>Suspend accounts that violate these terms</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                CramIntel is provided "as is" without warranties of any kind. We are not liable for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Academic performance or exam results</li>
                <li>Decisions made based on AI-generated content</li>
                <li>Loss of data due to technical issues</li>
                <li>Indirect, incidental, or consequential damages</li>
                <li>Use of the service that violates academic policies</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">10. Privacy and Data Protection</h2>
              <p className="text-gray-600 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect your information. By using CramIntel, you consent to our privacy practices.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">11. Termination</h2>
              <h3 className="text-xl font-medium mt-6 mb-3">11.1 By You</h3>
              <p className="text-gray-600 mb-4">
                You may terminate your account at any time by contacting our support team or using the account deletion feature in your settings.
              </p>
              
              <h3 className="text-xl font-medium mt-6 mb-3">11.2 By Us</h3>
              <p className="text-gray-600 mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>Violate these Terms of Service</li>
                <li>Engage in academic dishonesty using our platform</li>
                <li>Fail to pay subscription fees</li>
                <li>Misuse our service or harm other users</li>
              </ul>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We may update these Terms of Service periodically. We will notify you of significant changes via email and through our platform. Continued use after updates constitutes acceptance of the revised terms.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">13. Governing Law</h2>
              <p className="text-gray-600 mb-4">
                These Terms are governed by the laws of Nigeria. Any disputes will be resolved through binding arbitration in Lagos, Nigeria, except where prohibited by local law.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none mb-4 text-gray-600">
                <li><strong>Email:</strong> legal@cramintel.com</li>
                <li><strong>Student Support:</strong> support@cramintel.com</li>
                <li><strong>WhatsApp:</strong> +234 801 234 5678</li>
                <li><strong>Address:</strong> CramIntel Technologies, Lagos, Nigeria</li>
              </ul>
              
              <p className="text-gray-600 mt-8">
                By using CramIntel, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default TermsOfService;

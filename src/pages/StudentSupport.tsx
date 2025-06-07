
import { ArrowLeft, MessageCircle, Mail, Phone, HelpCircle, BookOpen, Users, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

const StudentSupport = () => {
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
            
            <h1 className="text-4xl font-bold mb-4">Student Support</h1>
            <p className="text-xl text-gray-600 mb-12">
              We're here to help you succeed! Find answers to common questions and get the support you need.
            </p>
            
            {/* Contact Methods */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center">
                <CardHeader>
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">Live Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Get instant help from our support team</p>
                  <Button className="w-full">Start Chat</Button>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <Mail className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">Email Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Send us your questions anytime</p>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:support@cramintel.com">Send Email</a>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <Phone className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Quick support via WhatsApp</p>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://wa.me/2348012345678" target="_blank" rel="noopener noreferrer">
                      Chat on WhatsApp
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Links */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Study Guides</h3>
                <p className="text-sm text-gray-600">Learn how to use CramIntel effectively</p>
              </Card>
              
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Community</h3>
                <p className="text-sm text-gray-600">Connect with other students</p>
              </Card>
              
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Privacy & Security</h3>
                <p className="text-sm text-gray-600">Your data protection matters</p>
              </Card>
              
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold mb-1">24/7 Support</h3>
                <p className="text-sm text-gray-600">We're always here to help</p>
              </Card>
            </div>
            
            {/* FAQ Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="getting-started">
                  <AccordionTrigger className="text-left">How do I get started with CramIntel?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>Getting started is easy! Follow these steps:</p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Create your free account using your university email</li>
                        <li>Complete the onboarding process by selecting your university and courses</li>
                        <li>Upload your first study material (lecture notes, textbook chapters, etc.)</li>
                        <li>Generate your first AI prediction or create flashcards</li>
                        <li>Start studying with personalized recommendations</li>
                      </ol>
                      <p className="text-primary font-medium">Pro tip: Start with your most challenging subject to see the biggest impact!</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="upload-materials">
                  <AccordionTrigger className="text-left">What types of study materials can I upload?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>You can upload various types of educational content:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Documents:</strong> PDF files, Word documents, PowerPoint slides</li>
                        <li><strong>Notes:</strong> Handwritten notes (as images), typed notes, lecture transcripts</li>
                        <li><strong>Textbooks:</strong> Relevant chapters and sections (ensure you have permission)</li>
                        <li><strong>Past Papers:</strong> Previous exam questions for pattern analysis</li>
                        <li><strong>Assignments:</strong> Completed coursework for review and learning</li>
                      </ul>
                      <p className="text-sm text-gray-600">Maximum file size: 25MB per upload. Supported formats: PDF, DOCX, PPTX, JPG, PNG</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai-predictions">
                  <AccordionTrigger className="text-left">How accurate are the AI exam predictions?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>Our AI predictions are designed to help you study more effectively:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Pattern Recognition:</strong> Identifies common themes and question styles from your materials</li>
                        <li><strong>Content Analysis:</strong> Highlights important concepts likely to appear on exams</li>
                        <li><strong>Difficulty Assessment:</strong> Predicts which topics may be emphasized</li>
                        <li><strong>Continuous Learning:</strong> Improves with more uploaded content and user feedback</li>
                      </ul>
                      <p className="text-amber-600 font-medium">Important: Use predictions as study guides, not as guaranteed exam content. Always study comprehensively!</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="flashcards">
                  <AccordionTrigger className="text-left">How do I create and use flashcards effectively?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>CramIntel makes flashcard creation and study simple:</p>
                      <h4 className="font-semibold">Creating Flashcards:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Upload your study material and let AI generate cards automatically</li>
                        <li>Manually create cards for specific concepts you want to memorize</li>
                        <li>Import existing flashcard sets from other platforms</li>
                      </ul>
                      <h4 className="font-semibold mt-3">Studying with Flashcards:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use spaced repetition for optimal memory retention</li>
                        <li>Focus on cards you're struggling with</li>
                        <li>Study in short, frequent sessions (15-20 minutes)</li>
                        <li>Review your progress and adjust difficulty levels</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="study-schedule">
                  <AccordionTrigger className="text-left">How does the AI study scheduling work?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>Our AI creates personalized study schedules based on:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Your Learning Style:</strong> Visual, auditory, or kinesthetic preferences</li>
                        <li><strong>Available Time:</strong> Your daily schedule and study availability</li>
                        <li><strong>Exam Dates:</strong> Upcoming tests and assignment deadlines</li>
                        <li><strong>Difficulty Level:</strong> Time needed for different subjects</li>
                        <li><strong>Progress Tracking:</strong> Adjusts based on your completion rates</li>
                      </ul>
                      <p className="text-primary font-medium">The schedule adapts as you use it, becoming more accurate over time!</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-security">
                  <AccordionTrigger className="text-left">Is my study data secure and private?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>Absolutely! We take your privacy seriously:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                        <li><strong>No Sharing:</strong> We never sell or share your personal study data</li>
                        <li><strong>Secure Storage:</strong> Enterprise-grade cloud security with regular audits</li>
                        <li><strong>Access Control:</strong> Only you can access your study materials</li>
                        <li><strong>Data Ownership:</strong> You retain full ownership of your uploaded content</li>
                      </ul>
                      <p>Read our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> for complete details.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="academic-integrity">
                  <AccordionTrigger className="text-left">Does using CramIntel violate academic integrity?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>CramIntel is designed to support legitimate learning:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Study Enhancement:</strong> We help you learn, not cheat</li>
                        <li><strong>Original Work:</strong> All tools encourage understanding, not copying</li>
                        <li><strong>Practice Focus:</strong> Predictions are for study preparation only</li>
                        <li><strong>Academic Standards:</strong> We comply with university integrity policies</li>
                      </ul>
                      <p className="text-red-600 font-medium">Never use CramIntel during actual exams or to submit generated content as your own work.</p>
                      <p>Always check your institution's specific policies and use CramIntel responsibly!</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="technical-issues">
                  <AccordionTrigger className="text-left">I'm experiencing technical issues. How can I get help?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>Here's how to get technical support quickly:</p>
                      <h4 className="font-semibold">Common Solutions:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Clear your browser cache and cookies</li>
                        <li>Try using a different browser or device</li>
                        <li>Check your internet connection</li>
                        <li>Disable browser extensions temporarily</li>
                      </ul>
                      <h4 className="font-semibold mt-3">Still Need Help?</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use our live chat for immediate assistance</li>
                        <li>Email support@cramintel.com with detailed error descriptions</li>
                        <li>Include screenshots if possible</li>
                        <li>Mention your browser type and operating system</li>
                      </ul>
                      <p className="text-primary font-medium">Our technical team typically responds within 2 hours during business hours!</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="subscription">
                  <AccordionTrigger className="text-left">What's the difference between free and premium plans?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <h4 className="font-semibold">Free Plan Includes:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>5 AI predictions per month</li>
                        <li>Basic flashcard creation (up to 100 cards)</li>
                        <li>Limited file uploads (100MB total)</li>
                        <li>Community access</li>
                        <li>Email support</li>
                      </ul>
                      <h4 className="font-semibold mt-3">Premium Plan Includes:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Unlimited AI predictions and analysis</li>
                        <li>Advanced flashcards with spaced repetition</li>
                        <li>Unlimited file storage (5GB)</li>
                        <li>Priority live chat support</li>
                        <li>Study group collaboration tools</li>
                        <li>Advanced progress analytics</li>
                        <li>Export capabilities</li>
                      </ul>
                      <p className="text-primary font-medium">Students save 50% with our educational discount!</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            {/* Study Tips Section */}
            <div className="bg-gray-50 rounded-lg p-6 mb-12">
              <h2 className="text-2xl font-bold mb-4">Study Tips for Success</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-primary">Effective Study Habits</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Study in focused 25-50 minute blocks</li>
                    <li>• Use active recall instead of passive reading</li>
                    <li>• Practice spaced repetition for long-term retention</li>
                    <li>• Create a dedicated study environment</li>
                    <li>• Take regular breaks to maintain focus</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-primary">Using CramIntel Effectively</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Upload materials immediately after lectures</li>
                    <li>• Review AI predictions as study guides</li>
                    <li>• Use flashcards for memorization tasks</li>
                    <li>• Join study groups for collaboration</li>
                    <li>• Track your progress and adjust strategies</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Community Guidelines */}
            <div className="border-l-4 border-primary pl-6 mb-12">
              <h2 className="text-xl font-bold mb-3">Community Guidelines</h2>
              <p className="text-gray-600 mb-4">
                CramIntel is a supportive learning community. Please:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Be respectful and helpful to fellow students</li>
                <li>Share knowledge and study tips</li>
                <li>Report inappropriate content or behavior</li>
                <li>Follow your institution's academic integrity policies</li>
                <li>Keep discussions academic and professional</li>
              </ul>
            </div>
            
            {/* Emergency Support */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Urgent Academic Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 mb-3">
                  Having academic difficulties or need immediate help before an exam?
                </p>
                <div className="space-y-2">
                  <p className="text-sm"><strong>WhatsApp:</strong> +234 801 234 5678 (24/7)</p>
                  <p className="text-sm"><strong>Email:</strong> urgent@cramintel.com</p>
                  <p className="text-sm text-red-600">
                    We prioritize urgent academic support requests and aim to respond within 30 minutes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default StudentSupport;

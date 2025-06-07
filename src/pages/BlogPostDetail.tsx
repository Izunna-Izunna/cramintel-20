
import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Separator } from '@/components/ui/separator';
import SEO from '@/components/SEO';
import { useEffect, useState } from 'react';
import { blogPosts } from '@/data/blogPosts';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Clock, MessageSquare, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LoadingAnimation } from '@/components/LoadingAnimation';

const BlogPostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(post => post.slug === slug);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Simulate loading for smoother transitions
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  if (!post) {
    return (
      <PageLayout>
        <SEO 
          title="Post Not Found - CramIntel" 
          description="The requested blog post could not be found." 
        />
        <div className="container mx-auto px-4 py-16 min-h-[50vh] flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-4">Post not found</h1>
          <p>We couldn't find the post you're looking for.</p>
        </div>
      </PageLayout>
    );
  }

  // Calculate reading time (average 200 words per minute)
  const wordCount = post.content.reduce((count, section) => {
    if (section.content) {
      return count + section.content.split(/\s+/).length;
    } else if (section.items) {
      return count + section.items.join(' ').split(/\s+/).length;
    }
    return count;
  }, 0);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Format date for machine-readable ISO format (for structured data)
  const formatDateForISO = (dateStr: string) => {
    if (!dateStr) return '';
    const months: Record<string, string> = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const month = months[parts[0]];
      const day = parts[1].replace(',', '');
      const year = parts[2];
      if (month) {
        return `${year}-${month}-${day.padStart(2, '0')}`;
      }
    }
    return dateStr;
  };

  // Extract keywords from post content
  const extractKeywords = () => {
    const keywords = ['study tips', 'university success', post.category.toLowerCase()];
    if (post.keywords) {
      keywords.push(...post.keywords);
    }
    return keywords;
  };

  return (
    <PageLayout>
      <SEO 
        title={`${post.title} - CramIntel`}
        description={post.metaDescription || post.excerpt}
        imageUrl={post.imageUrl}
        type="article"
        isBlogPost={true}
        publishDate={formatDateForISO(post.date)}
        modifiedDate={formatDateForISO(post.date)}
        author={post.author}
        category={post.category}
        keywords={extractKeywords()}
      />
      
      <div className="w-full pt-32 pb-16 relative bg-gradient-to-b from-gray-900 to-black text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('${post.imageUrl}')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 flex items-center gap-1.5">
                <Tag size={14} />
                {post.category}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-white/80 backdrop-blur-sm flex items-center gap-1.5">
                <Calendar size={14} />
                {post.date}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-white/80 backdrop-blur-sm flex items-center gap-1.5">
                <Clock size={14} />
                {readingTime} min read
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{post.title}</h1>
            <div className="flex items-center text-gray-300">
              <BookOpen size={18} className="mr-2" />
              <span>By {post.author}</span>
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingAnimation />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-lg max-w-none"
            >
              {post.content.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className={cn("mb-8", section.type === 'quote' && "my-10")}
                >
                  {section.type === 'paragraph' && (
                    <p className="text-gray-700 mb-4 leading-relaxed text-lg">
                      {section.content}
                    </p>
                  )}
                  
                  {section.type === 'heading' && (
                    <div className="flex items-center gap-3 mt-12 mb-6">
                      <div className="w-1.5 h-7 bg-primary rounded-full"></div>
                      <h2 className="text-2xl font-bold text-gray-900">{section.content}</h2>
                    </div>
                  )}
                  
                  {section.type === 'subheading' && (
                    <h3 className="text-xl font-bold mt-8 mb-3 text-gray-800 flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary/60 rounded-full"></div>
                      {section.content}
                    </h3>
                  )}
                  
                  {section.type === 'list' && (
                    <ul className="list-disc pl-5 my-4 space-y-2">
                      {section.items?.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  )}
                  
                  {section.type === 'table' && section.tableData && (
                    <div className="my-8 overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            {section.tableData.headers.map((header, headerIndex) => (
                              <th key={headerIndex} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.tableData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {section.type === 'quote' && (
                    <blockquote className="border-l-4 border-primary pl-5 py-2 my-8 bg-primary/5 rounded-r-lg italic text-gray-700">
                      <div className="flex">
                        <MessageSquare size={20} className="text-primary mr-3 mt-1 flex-shrink-0" />
                        <p className="text-lg m-0">{section.content}</p>
                      </div>
                    </blockquote>
                  )}
                </motion.div>
              ))}
            </motion.div>
            
            <Separator className="my-8" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between py-6 bg-gray-50 rounded-lg p-6 shadow-sm">
              <div>
                <p className="text-sm text-gray-600 font-medium">Category: {post.category}</p>
              </div>
              <Link to="/dashboard" className="mt-4 sm:mt-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Start Learning with CramIntel
                </motion.button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BlogPostDetail;

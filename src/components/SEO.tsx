
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  type?: string;
  name?: string;
  imageUrl?: string;
  publishDate?: string;
  modifiedDate?: string;
  author?: string;
  category?: string;
  keywords?: string[];
  isBlogPost?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title = 'CramIntel',
  description = 'CramIntel: AI-powered exam predictions and smart study tools for West African university students. Cut the noise. Learn what counts.',
  type = 'website',
  name = 'CramIntel',
  imageUrl = '/lovable-uploads/48ecf6e2-5a98-4a9d-af6f-ae2265cd4098.png',
  publishDate,
  modifiedDate,
  author,
  category,
  keywords = ['exam predictions', 'AI study tools', 'flashcards', 'university students', 'West Africa', 'smart learning', 'exam prep', 'study communities'],
  isBlogPost = false
}) => {
  const location = useLocation();
  const currentUrl = `https://cramintel.com${location.pathname}`;
  const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://cramintel.com${imageUrl}`;

  // Enhanced keywords for educational content
  const enhancedKeywords = location.pathname.includes('study-tips') 
    ? [
        ...keywords,
        'study techniques',
        'exam strategies',
        'academic success',
        'university tips',
        'learning methods',
        'student productivity',
        'test preparation',
        'study planning',
        'academic performance',
        'student success'
      ]
    : keywords;

  // Create base Organization JSON-LD structured data
  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CramIntel',
    url: 'https://cramintel.com',
    logo: 'https://cramintel.com/lovable-uploads/cramintel-logo.png',
    description: 'AI-powered exam predictions and smart study tools for university students',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@cramintel.com'
    },
    sameAs: [
      'https://www.linkedin.com/company/cramintel',
      'https://twitter.com/cramintel'
    ]
  };

  // Enhanced BlogPosting JSON-LD structured data
  const blogPostStructuredData = isBlogPost && publishDate ? {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentUrl
    },
    headline: title,
    image: {
      '@type': 'ImageObject',
      url: absoluteImageUrl,
      width: 1200,
      height: 630
    },
    datePublished: publishDate,
    dateModified: modifiedDate || publishDate,
    author: {
      '@type': 'Organization',
      name: author || 'CramIntel',
      url: 'https://cramintel.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'CramIntel',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cramintel.com/lovable-uploads/cramintel-logo.png',
        width: 512,
        height: 512
      },
      url: 'https://cramintel.com'
    },
    description: description,
    keywords: enhancedKeywords.join(', '),
    articleSection: category,
    inLanguage: 'en-US',
    isAccessibleForFree: true
  } : null;

  // Add FAQ structured data for Study Tips posts
  const studyTipsFAQData = location.pathname.includes('study-tips') ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does CramIntel predict exam questions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CramIntel uses AI to analyze your uploaded notes, past questions, and assignment patterns to predict likely exam questions. Our algorithms identify recurring themes, important concepts, and typical question formats used by lecturers.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I use CramIntel for any university course?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! CramIntel works with any course or subject. Simply upload your notes, past questions, and assignments, and our AI will generate personalized study materials and exam predictions for your specific courses.'
        }
      },
      {
        '@type': 'Question',
        name: 'How accurate are the exam predictions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our prediction accuracy improves with more data. The more notes, past questions, and course materials you upload, the better our AI becomes at identifying patterns and predicting likely exam questions for your specific courses and lecturers.'
        }
      }
    ]
  } : null;

  // Combine keywords with any additional category terms
  const keywordString = category 
    ? [...enhancedKeywords, category.toLowerCase()].join(', ') 
    : enhancedKeywords.join(', ');

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />
      <meta name="keywords" content={keywordString} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={isBlogPost ? 'article' : type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="CramIntel" />
      <meta property="og:locale" content="en_US" />
      {isBlogPost && category && <meta property="article:section" content={category} />}
      {isBlogPost && publishDate && <meta property="article:published_time" content={publishDate} />}
      {isBlogPost && modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
      {isBlogPost && <meta property="article:publisher" content="https://cramintel.com" />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImageUrl} />
      <meta name="twitter:site" content="@cramintel" />
      <meta name="twitter:creator" content="@cramintel" />
      
      {/* LinkedIn specific */}
      <meta property="og:image:secure_url" content={absoluteImageUrl} />
      <meta name="author" content={author || name} />
      
      {/* Pinterest specific */}
      <meta name="pinterest:description" content={description} />
      <meta name="pinterest:image" content={absoluteImageUrl} />
      
      {/* Additional SEO meta tags */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      
      {/* JSON-LD structured data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationStructuredData)}
      </script>
      
      {blogPostStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(blogPostStructuredData)}
        </script>
      )}
      
      {studyTipsFAQData && (
        <script type="application/ld+json">
          {JSON.stringify(studyTipsFAQData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

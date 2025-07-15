import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  schemaData?: any;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "TrackCareer - #1 Career Tracking Platform for Students & Professionals",
  description = "The ultimate career tracking platform for students and professionals. Track job applications, manage resumes, practice DSA problems, monitor courses, and accelerate your career growth.",
  keywords = "career tracking, job application tracker, resume management, DSA practice tracker, career development, student career planning, professional growth",
  canonicalUrl = "https://trackcareer.lovable.app",
  ogImage = "https://trackcareer.lovable.app/og-image.png",
  schemaData
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    }

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update Open Graph meta tags
    const updateOGMeta = (property: string, content: string) => {
      let ogMeta = document.querySelector(`meta[property="${property}"]`);
      if (!ogMeta) {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', property);
        document.head.appendChild(ogMeta);
      }
      ogMeta.setAttribute('content', content);
    };

    updateOGMeta('og:title', title);
    updateOGMeta('og:description', description);
    updateOGMeta('og:url', canonicalUrl);
    updateOGMeta('og:image', ogImage);

    // Update Twitter Card meta tags
    const updateTwitterMeta = (name: string, content: string) => {
      let twitterMeta = document.querySelector(`meta[name="${name}"]`);
      if (!twitterMeta) {
        twitterMeta = document.createElement('meta');
        twitterMeta.setAttribute('name', name);
        document.head.appendChild(twitterMeta);
      }
      twitterMeta.setAttribute('content', content);
    };

    updateTwitterMeta('twitter:title', title);
    updateTwitterMeta('twitter:description', description);
    updateTwitterMeta('twitter:image', ogImage);

    // Add structured data if provided
    if (schemaData) {
      let schemaScript = document.querySelector('#dynamic-schema');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.setAttribute('type', 'application/ld+json');
        schemaScript.setAttribute('id', 'dynamic-schema');
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schemaData);
    }

    // Add breadcrumb navigation for better SEO
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": canonicalUrl
        }
      ]
    };

    let breadcrumbScript = document.querySelector('#breadcrumb-schema');
    if (!breadcrumbScript) {
      breadcrumbScript = document.createElement('script');
      breadcrumbScript.setAttribute('type', 'application/ld+json');
      breadcrumbScript.setAttribute('id', 'breadcrumb-schema');
      document.head.appendChild(breadcrumbScript);
    }
    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);

  }, [title, description, keywords, canonicalUrl, ogImage, schemaData]);

  return null; // This component doesn't render anything
};

// Hook for section-specific SEO
export const useSectionSEO = (section: string) => {
  const sectionSEOData = {
    dashboard: {
      title: "Career Dashboard - Track Your Professional Journey | TrackCareer",
      description: "Comprehensive career dashboard to monitor your job applications, resume updates, coding practice, and professional development goals. Get insights into your career progression.",
      keywords: "career dashboard, professional development tracking, career analytics, job search dashboard, career management interface",
      schemaData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Career Dashboard",
        "description": "Professional career tracking dashboard",
        "mainEntity": {
          "@type": "WebApplication",
          "name": "Career Dashboard",
          "applicationCategory": "BusinessApplication"
        }
      }
    },
    resumes: {
      title: "Resume Manager - Organize & Share Professional Resumes | TrackCareer",
      description: "Advanced resume management system. Upload, organize, version control, and share your resumes. Track which resume was sent to which employer.",
      keywords: "resume manager, resume organizer, CV management, resume tracking, professional resume storage, resume version control",
      schemaData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Resume Manager",
        "description": "Professional resume management and organization tool"
      }
    },
    jobs: {
      title: "Job Application Tracker - Manage Your Job Search | TrackCareer",
      description: "Track job applications, interview rounds, company communications, and follow-ups. Never lose track of your job search progress again.",
      keywords: "job application tracker, job search management, interview tracking, job hunt organizer, application status tracker",
      schemaData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Job Application Tracker",
        "description": "Comprehensive job application and interview tracking system"
      }
    },
    dsa: {
      title: "DSA Practice Tracker - Coding Interview Preparation | TrackCareer",
      description: "Track your Data Structures & Algorithms practice. Monitor coding problems solved, track difficulty levels, and prepare for technical interviews.",
      keywords: "DSA tracker, coding practice tracker, algorithm practice, data structures practice, coding interview prep, leetcode tracker",
      schemaData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "DSA Practice Tracker",
        "description": "Data Structures and Algorithms practice tracking for coding interviews"
      }
    },
    courses: {
      title: "Course Progress Tracker - Monitor Your Learning Journey | TrackCareer",
      description: "Track online courses, certifications, and learning progress. Organize course materials and monitor your educational development.",
      keywords: "course tracker, learning progress tracker, online course management, certification tracking, educational progress monitor",
      schemaData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Course Progress Tracker",
        "description": "Educational course and learning progress tracking system"
      }
    },
    analytics: {
      title: "Career Analytics - Insights & Progress Reports | TrackCareer",
      description: "Get detailed analytics on your career progress. Track job application success rates, coding practice trends, and professional development metrics.",
      keywords: "career analytics, job search analytics, professional development insights, career progress reports, job application metrics",
      schemaData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Career Analytics",
        "description": "Comprehensive career progress analytics and insights"
      }
    }
  };

  return sectionSEOData[section as keyof typeof sectionSEOData] || sectionSEOData.dashboard;
};
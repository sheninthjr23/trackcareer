import React from 'react';

interface SEOWrapperProps {
  children: React.ReactNode;
  section?: string;
  className?: string;
}

export const SEOWrapper: React.FC<SEOWrapperProps> = ({ 
  children, 
  section = 'main',
  className = '' 
}) => {
  const getSectionSchema = (sectionName: string) => {
    const schemas = {
      dashboard: {
        '@context': 'https://schema.org',
        '@type': 'WebPageElement',
        name: 'Career Dashboard',
        description: 'Professional career tracking dashboard interface',
        isPartOf: {
          '@type': 'WebPage',
          name: 'TrackCareer Platform'
        }
      },
      'job-tracker': {
        '@context': 'https://schema.org',
        '@type': 'WebPageElement',
        name: 'Job Application Tracker',
        description: 'Job application and interview tracking interface',
        mainContentOfPage: true
      },
      'resume-manager': {
        '@context': 'https://schema.org',
        '@type': 'WebPageElement',
        name: 'Resume Management System',
        description: 'Professional resume organization and sharing interface'
      },
      'dsa-tracker': {
        '@context': 'https://schema.org',
        '@type': 'WebPageElement',
        name: 'DSA Practice Tracker',
        description: 'Data Structures and Algorithms practice tracking interface'
      },
      'course-tracker': {
        '@context': 'https://schema.org',
        '@type': 'WebPageElement',
        name: 'Course Progress Tracker',
        description: 'Educational course and learning progress interface'
      },
      'analytics': {
        '@context': 'https://schema.org',
        '@type': 'WebPageElement',
        name: 'Career Analytics Dashboard',
        description: 'Career progress analytics and insights interface'
      }
    };

    return schemas[sectionName as keyof typeof schemas] || schemas.dashboard;
  };

  const schemaData = getSectionSchema(section);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData)
        }}
      />
      <main
        className={`career-tracking-platform ${section}-section ${className}`}
        role="main"
        aria-label={`${section.replace('-', ' ')} interface`}
        itemScope
        itemType="https://schema.org/WebPageElement"
      >
        <meta itemProp="name" content={schemaData.name} />
        <meta itemProp="description" content={schemaData.description} />
        {children}
      </main>
    </>
  );
};
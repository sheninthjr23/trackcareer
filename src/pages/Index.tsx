
import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ResumeManager } from '@/components/ResumeManager';
import { CourseManager } from '@/components/CourseManager';
import { DoubtManager } from '@/components/DoubtManager';
import { YoutubeManager } from '@/components/YoutubeManager';
import { ActivityTracker } from '@/components/ActivityTracker';
import { JobApplicationTracker } from '@/components/JobApplicationTracker';
import { DSATracker } from '@/components/DSATracker';
import { StoryManager } from '@/components/StoryManager';
import { Dashboard } from '@/components/Dashboard';
import { Settings } from '@/components/Settings';
import { Analytics } from '@/components/Analytics';
import { Auth } from '@/components/Auth';
import { Header } from '@/components/Header';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { SEOHead, useSectionSEO } from '@/components/SEOHead';
import { SEOWrapper } from '@/components/SEOWrapper';

export type Section = 'dashboard' | 'resumes' | 'courses' | 'doubts' | 'youtube' | 'activities' | 'jobs' | 'dsa' | 'stories' | 'analytics' | 'settings';

function AppContent() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const { user, loading } = useAuth();
  const sectionSEO = useSectionSEO(activeSection);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleSectionChange = (section: 'resumes' | 'courses' | 'activities' | 'jobs' | 'dsa') => {
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onSectionChange={handleSectionChange} />;
      case 'resumes':
        return <ResumeManager />;
      case 'courses':
        return <CourseManager />;
      case 'doubts':
        return <DoubtManager />;
      case 'youtube':
        return <YoutubeManager />;
      case 'activities':
        return <ActivityTracker />;
      case 'jobs':
        return <JobApplicationTracker />;
      case 'dsa':
        return <DSATracker />;
      case 'stories':
        return <StoryManager />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onSectionChange={handleSectionChange} />;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Personal Dashboard';
      case 'resumes':
        return 'Resume Management';
      case 'courses':
        return 'Course Management';
      case 'doubts':
        return 'Doubt & Notes';
      case 'youtube':
        return 'YouTube Learning';
      case 'activities':
        return 'Activity Tracking';
      case 'jobs':
        return 'Job Applications';
      case 'dsa':
        return 'DSA Problem Tracker';
      case 'stories':
        return 'Story Authoring';
      case 'analytics':
        return 'Analytics & Reports';
      case 'settings':
        return 'Account Settings';
      default:
        return 'Personal Dashboard';
    }
  };

  const getSectionDescription = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Manage your professional journey with style';
      case 'resumes':
        return 'Upload, organize, and share your resumes';
      case 'courses':
        return 'Track your learning journey and course progress';
      case 'doubts':
        return 'Organize your questions and markdown notes';
      case 'youtube':
        return 'Manage YouTube videos and learning todos';
      case 'activities':
        return 'Monitor your tasks and activities';
      case 'jobs':
        return 'Keep track of your job applications and progress';
      case 'dsa':
        return 'Track your Data Structures & Algorithms practice journey';
      case 'stories':
        return 'Create and manage your stories with AI assistance';
      case 'analytics':
        return 'View comprehensive analytics and progress reports';
      case 'settings':
        return 'Manage your account and preferences';
      default:
        return 'Manage your professional journey with style';
    }
  };

  return (
    <>
      <SEOHead 
        title={sectionSEO.title}
        description={sectionSEO.description}
        keywords={sectionSEO.keywords}
        schemaData={sectionSEO.schemaData}
      />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
          <SEOWrapper section={activeSection} className="flex-1 overflow-hidden">
            <Header 
              title={getSectionTitle()} 
              description={getSectionDescription()} 
            />
            <section 
              className="p-6 h-[calc(100vh-6rem)] overflow-auto"
              aria-label={`${getSectionTitle()} content area`}
              role="region"
            >
              <div className="max-w-7xl mx-auto">
                <h1 className="sr-only">
                  {getSectionTitle()} - {getSectionDescription()}
                </h1>
                {renderContent()}
              </div>
            </section>
          </SEOWrapper>
        </div>
      </SidebarProvider>
    </>
  );
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ResumeManager } from '@/components/ResumeManager';
import { CourseManager } from '@/components/CourseManager';
import { DoubtManager } from '@/components/DoubtManager';
import { YoutubeManager } from '@/components/YoutubeManager';
import { ActivityTracker } from '@/components/ActivityTracker';
import { JobApplicationTracker } from '@/components/JobApplicationTracker';
import { Dashboard } from '@/components/Dashboard';
import { Auth } from '@/components/Auth';
import { Header } from '@/components/Header';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

export type Section = 'dashboard' | 'resumes' | 'courses' | 'doubts' | 'youtube' | 'activities' | 'jobs';

function AppContent() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const { user, loading } = useAuth();

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

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
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
      default:
        return <Dashboard />;
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
      default:
        return 'Manage your professional journey with style';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-1 overflow-hidden">
          <Header 
            title={getSectionTitle()} 
            description={getSectionDescription()} 
          />
          <div className="p-6 h-[calc(100vh-6rem)] overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
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

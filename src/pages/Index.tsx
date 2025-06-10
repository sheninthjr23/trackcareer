
import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ResumeManager } from '@/components/ResumeManager';
import { CourseManager } from '@/components/CourseManager';
import { ActivityTracker } from '@/components/ActivityTracker';
import { JobApplicationTracker } from '@/components/JobApplicationTracker';
import { Dashboard } from '@/components/Dashboard';

export type Section = 'dashboard' | 'resumes' | 'courses' | 'activities' | 'jobs';

const Index = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'resumes':
        return <ResumeManager />;
      case 'courses':
        return <CourseManager />;
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
      case 'activities':
        return 'Activity Tracking';
      case 'jobs':
        return 'Job Applications';
      default:
        return 'Personal Dashboard';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-black/50 to-black/30 backdrop-blur-sm px-6 py-5">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white hover:bg-white/10" />
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  {getSectionTitle()}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your professional journey with style
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Online</span>
            </div>
          </div>
          <div className="p-6 h-[calc(100vh-6rem)] overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;

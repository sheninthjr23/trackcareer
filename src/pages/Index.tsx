
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-gradient capitalize">
                {activeSection === 'dashboard' ? 'Personal Dashboard' : activeSection}
              </h1>
            </div>
          </div>
          <div className="p-6 h-[calc(100vh-5rem)] overflow-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;

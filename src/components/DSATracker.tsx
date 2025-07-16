
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DSAFolderManager } from './dsa/DSAFolderManager';
import { DSAProblemsView } from './dsa/DSAProblemsView';
import { DSAWeeklyActivity } from './dsa/DSAWeeklyActivity';
import { DSAAnalytics } from './dsa/DSAAnalytics';
import { DSALiveSection } from './dsa/DSALiveSection';
import { Folder, Target, Activity, BarChart3, Zap } from 'lucide-react';

export const DSATracker = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('live');

  return (
    <div className="space-y-6">
      <div className="flex-responsive items-responsive justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-responsive-xl font-bold">DSA Problem Tracker</h1>
          <p className="text-responsive-sm text-muted-foreground">
            Track your Data Structures & Algorithms practice journey
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-1">
          <TabsTrigger value="live" className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm touch-target">
            <Zap className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline">Live Section</span>
            <span className="xs:hidden">Live</span>
          </TabsTrigger>
          <TabsTrigger value="folders" className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm touch-target">
            <Folder className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden sm:inline">Folders & Problems</span>
            <span className="sm:hidden">Folders</span>
          </TabsTrigger>
          <TabsTrigger value="problems" className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm touch-target">
            <Target className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden sm:inline">All Problems</span>
            <span className="sm:hidden">Problems</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm touch-target">
            <Activity className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden sm:inline">Weekly Activity</span>
            <span className="sm:hidden">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm touch-target">
            <BarChart3 className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <DSALiveSection />
        </TabsContent>

        <TabsContent value="folders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Folders</CardTitle>
                </CardHeader>
                <CardContent>
                  <DSAFolderManager 
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={setSelectedFolderId}
                  />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedFolderId ? 'Problems in Folder' : 'Select a Folder'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedFolderId ? (
                    <DSAProblemsView folderId={selectedFolderId} />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Select a folder to view and manage problems
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="problems">
          <Card>
            <CardHeader>
              <CardTitle>All Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <DSAProblemsView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <DSAWeeklyActivity />
        </TabsContent>

        <TabsContent value="analytics">
          <DSAAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

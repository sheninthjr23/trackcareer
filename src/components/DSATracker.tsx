
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { DSAFolderManager } from './dsa/DSAFolderManager';
import { DSAProblemsView } from './dsa/DSAProblemsView';
import { DSAWeeklyActivity } from './dsa/DSAWeeklyActivity';
import { DSAAnalytics } from './dsa/DSAAnalytics';
import { DSALiveSection } from './dsa/DSALiveSection';
import { Folder, Target, Activity, BarChart3, Zap } from 'lucide-react';

export const DSATracker = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('live');
  const [draggedProblem, setDraggedProblem] = useState<any>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const problem = event.active.data.current?.problem;
    setDraggedProblem(problem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedProblem(null);

    if (!over) return;

    const problemId = active.id as string;
    const targetFolderId = over.id as string;
    const problem = active.data.current?.problem;

    if (problem && targetFolderId && problem.folder_id !== targetFolderId) {
      // We'll pass this to the DSAProblemsView component
      const moveProblemEvent = new CustomEvent('moveProblem', {
        detail: { problemId, targetFolderId, problem }
      });
      window.dispatchEvent(moveProblemEvent);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DSA Problem Tracker</h1>
          <p className="text-muted-foreground">
            Track your Data Structures & Algorithms practice journey
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Live Section
          </TabsTrigger>
          <TabsTrigger value="folders" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Folders & Problems
          </TabsTrigger>
          <TabsTrigger value="problems" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            All Problems
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Weekly Activity
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <DSALiveSection />
        </TabsContent>

        <TabsContent value="folders" className="space-y-6">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="lg:col-span-2">
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
            <DragOverlay>
              {draggedProblem ? (
                <div className="bg-card border rounded-lg p-4 shadow-lg">
                  <h3 className="font-medium">{draggedProblem.title}</h3>
                  <div className="text-sm text-muted-foreground">{draggedProblem.topic}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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

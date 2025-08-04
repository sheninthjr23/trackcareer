import React, { createContext, useContext } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DSAProblem {
  id: string;
  title: string;
  problem_link: string | null;
  topic: string;
  level: string;
  github_solution_link: string | null;
  youtube_link: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  folder_id: string;
  code_solutions: any[];
  is_live_problem: boolean | null;
  live_added_at: string | null;
  live_todo_completed: boolean | null;
  live_todo_completed_at: string | null;
}

interface DSADragDropContextType {
  activeProblem: DSAProblem | null;
}

const DSADragDropContext = createContext<DSADragDropContextType | undefined>(undefined);

export const useDSADragDrop = () => {
  const context = useContext(DSADragDropContext);
  if (context === undefined) {
    throw new Error('useDSADragDrop must be used within a DSADragDropProvider');
  }
  return context;
};

interface DSADragDropProviderProps {
  children: React.ReactNode;
}

export const DSADragDropProvider: React.FC<DSADragDropProviderProps> = ({ children }) => {
  const [activeProblem, setActiveProblem] = React.useState<DSAProblem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const updateProblemMutation = useMutation({
    mutationFn: async ({ 
      problemId, 
      updates 
    }: { 
      problemId: string; 
      updates: Partial<DSAProblem> 
    }) => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .update(updates)
        .eq('id', problemId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsa-problems'] });
      queryClient.invalidateQueries({ queryKey: ['dsa-live-todos'] });
      toast({ title: 'Problem updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating problem', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const problem = active.data.current?.problem as DSAProblem;
    setActiveProblem(problem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProblem(null);

    if (!over) return;

    const problem = active.data.current?.problem as DSAProblem;
    const dropZone = over.data.current?.dropZone;

    if (!problem || !dropZone) return;

    // Handle different drop zones
    switch (dropZone.type) {
      case 'folder':
        if (problem.folder_id !== dropZone.folderId) {
          updateProblemMutation.mutate({
            problemId: problem.id,
            updates: {
              folder_id: dropZone.folderId,
            }
          });
        }
        break;

      case 'live-section':
        const currentTime = new Date().toISOString();
        updateProblemMutation.mutate({
          problemId: problem.id,
          updates: {
            is_live_problem: true,
            live_added_at: currentTime,
            live_todo_completed: false,
            live_todo_completed_at: null,
          }
        });
        break;

      case 'topic-filter':
        if (problem.topic !== dropZone.topic) {
          updateProblemMutation.mutate({
            problemId: problem.id,
            updates: {
              topic: dropZone.topic,
            }
          });
        }
        break;

      case 'level-filter':
        if (problem.level !== dropZone.level) {
          updateProblemMutation.mutate({
            problemId: problem.id,
            updates: {
              level: dropZone.level,
            }
          });
        }
        break;

      case 'completed-section':
        if (!problem.is_completed) {
          updateProblemMutation.mutate({
            problemId: problem.id,
            updates: {
              is_completed: true,
              completed_at: new Date().toISOString(),
            }
          });
        }
        break;

      case 'pending-section':
        if (problem.is_completed) {
          updateProblemMutation.mutate({
            problemId: problem.id,
            updates: {
              is_completed: false,
              completed_at: null,
            }
          });
        }
        break;
    }
  };

  return (
    <DSADragDropContext.Provider value={{ activeProblem }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {activeProblem ? (
            <div className="bg-background border border-primary rounded-lg p-3 shadow-lg">
              <div className="font-medium text-sm">{activeProblem.title}</div>
              <div className="text-xs text-muted-foreground">
                {activeProblem.topic} • {activeProblem.level}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DSADragDropContext.Provider>
  );
};
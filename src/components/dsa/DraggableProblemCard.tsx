import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Youtube, GripVertical } from 'lucide-react';

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

interface DraggableProblemCardProps {
  problem: DSAProblem;
  children?: React.ReactNode;
  className?: string;
}

export const DraggableProblemCard: React.FC<DraggableProblemCardProps> = ({
  problem,
  children,
  className = '',
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: problem.id,
    data: {
      problem,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getLevelBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'easy': return 'default';
      case 'medium': return 'secondary';
      case 'hard': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`${className} ${isDragging ? 'opacity-50' : ''} cursor-grab active:cursor-grabbing`}
      {...attributes}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div 
            {...listeners}
            className="mt-1 text-muted-foreground hover:text-primary cursor-grab"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm leading-5">{problem.title}</h3>
              <div className="flex gap-1">
                <Badge variant={getLevelBadgeVariant(problem.level)} className="text-xs">
                  {problem.level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {problem.topic}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {problem.problem_link && (
                <Button variant="ghost" size="sm" asChild className="h-6 px-2">
                  <a href={problem.problem_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              {problem.github_solution_link && (
                <Button variant="ghost" size="sm" asChild className="h-6 px-2">
                  <a href={problem.github_solution_link} target="_blank" rel="noopener noreferrer">
                    <Github className="h-3 w-3" />
                  </a>
                </Button>
              )}
              {problem.youtube_link && (
                <Button variant="ghost" size="sm" asChild className="h-6 px-2">
                  <a href={problem.youtube_link} target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>

            {children && (
              <div className="pt-2">
                {children}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};